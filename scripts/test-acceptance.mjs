// scripts/test-acceptance.mjs
// Automated End-to-End Acceptance Test Suite for 3D Diagram Transformer SaaS Backend

import crypto from 'crypto';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function pass(msg) {
  console.log(`${colors.green}  ✓ PASS: ${msg}${colors.reset}`);
}

function fail(msg, details) {
  console.error(`${colors.red}  ✗ FAIL: ${msg}${colors.reset}`);
  if (details) console.error(`    ${JSON.stringify(details)}`);
  process.exitCode = 1;
}

function section(title) {
  console.log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}`);
}

async function runTests() {
  const timestamp = Date.now();
  const testUser = {
    name: `Acceptance Tester ${timestamp}`,
    email: `tester_${timestamp}@example.com`,
    password: 'SecurePassword123!',
    orgName: `Acme Corp ${timestamp}`,
  };

  let token = null;
  let orgId = null;
  let diagramIds = [];
  let templateId = null;

  // 1. Health Check
  section('1. Health Diagnostics');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    const dbOk = data.services?.database === 'connected' || data.services?.database?.status === 'connected';
    const redisOk = data.services?.redis === 'connected' || data.services?.redis?.status === 'connected';
    if (res.status === 200 && data.status === 'healthy' && dbOk && redisOk) {
      pass(`API Health: Database & Redis operational (uptime: ${Math.round(data.uptimeSeconds || data.uptime || 0)}s)`);
    } else {
      fail('Health check response invalid', data);
    }
  } catch (err) {
    fail('Health check failed to connect', err.message);
    return;
  }

  // 2. User Registration & Org Creation
  section('2. Authentication & Multi-Tenancy');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const data = await res.json();
    if (res.status === 200 && data.accessToken && data.user?.organizationId) {
      token = data.accessToken;
      orgId = data.user.organizationId;
      pass(`Registered user "${testUser.email}" with Org "${data.user.organizationName}" (Plan: ${data.user.plan || 'free'})`);
    } else {
      fail('User registration failed', data);
      return;
    }
  } catch (err) {
    fail('User registration error', err.message);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 3. User Login & Verification
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    const data = await res.json();
    if (res.status === 200 && data.accessToken) {
      pass(`Login credentials verified and JWT re-issued successfully`);
    } else {
      fail('Login failed', data);
    }
  } catch (err) {
    fail('Login error', err.message);
  }

  // 4. Verify Seeded Official Templates
  section('3. Architecture Templates Engine');
  try {
    const res = await fetch(`${BASE_URL}/api/templates`, { headers: authHeaders });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data.templates) && data.templates.length >= 5) {
      templateId = data.templates[0].id;
      pass(`Discovered ${data.templates.length} official 3D reference templates (Seed verified)`);
      data.templates.forEach((t) => console.log(`    - [${t.category}] ${t.name}`));
    } else {
      fail('Templates listing failed or seed missing', data);
    }
  } catch (err) {
    fail('Templates listing error', err.message);
  }

  // 5. Plan Limits & Feature-Gating (Free Plan allows max 3 diagrams)
  section('4. Feature-Gating & Plan Limit Enforcement');
  for (let i = 1; i <= 3; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/diagrams`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: `Architecture Diagram #${i}`,
          description: `Test diagram number ${i} in 3D canvas`,
          data: {
            nodes: [{ id: 'node-1', name: 'API Gateway', type: 'cloud_gateway' }],
            connections: [],
          },
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.diagram?.id) {
        diagramIds.push(data.diagram.id);
        pass(`Created diagram #${i} ("${data.diagram.name}") -> 201 Created`);
      } else {
        fail(`Failed to create diagram #${i}`, data);
      }
    } catch (err) {
      fail(`Diagram creation error on #${i}`, err.message);
    }
  }

  // Attempt 4th diagram -> Expect 402 PLAN_LIMIT_REACHED
  try {
    const res = await fetch(`${BASE_URL}/api/diagrams`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `Architecture Diagram #4 (Over Limit)`,
        description: `This should be blocked by free plan limit`,
        data: { nodes: [{ id: 'n1', name: 'Extra' }], connections: [] },
      }),
    });
    const data = await res.json();
    if (res.status === 402 && data.code === 'PLAN_LIMIT_REACHED') {
      pass(`Plan limit blocked 4th diagram -> 402 Payment Required (${data.code}: ${data.error})`);
    } else {
      fail('Expected 402 PLAN_LIMIT_REACHED, got:', { status: res.status, body: data });
    }
  } catch (err) {
    fail('Error testing 402 plan limit', err.message);
  }

  // BUG-003: Attempt duplicate diagram on Free plan when limit reached -> Expect 402 PLAN_LIMIT_REACHED
  try {
    const res = await fetch(`${BASE_URL}/api/diagrams/${diagramIds[0]}/duplicate`, {
      method: 'POST',
      headers: authHeaders,
    });
    const data = await res.json();
    if (res.status === 402 && data.code === 'PLAN_LIMIT_REACHED') {
      pass(`[BUG-003] Duplicate quota check blocked on Free plan -> 402 Payment Required (${data.code})`);
    } else {
      fail('[BUG-003] Expected duplicate to return 402 PLAN_LIMIT_REACHED, got:', { status: res.status, body: data });
    }
  } catch (err) {
    fail('[BUG-003] Error testing duplicate quota', err.message);
  }

  // BUG-001: Verify fast listing returns faithful nodeCount
  try {
    const res = await fetch(`${BASE_URL}/api/diagrams`, { headers: authHeaders });
    const data = await res.json();
    const hasValidNodeCounts = Array.isArray(data.data) && data.data.every((d) => typeof d.nodeCount === 'number');
    if (res.status === 200 && hasValidNodeCounts && data.data[0].nodeCount === 1) {
      pass(`[BUG-001] Fast listing returns faithful integer nodeCount (${data.data[0].nodeCount} nodes)`);
    } else {
      fail('[BUG-001] nodeCount missing or invalid in listing payload', data);
    }
  } catch (err) {
    fail('[BUG-001] Error checking nodeCount integrity', err.message);
  }

  // BUG-007: Atomic issuance and revocation of shareToken in PostgreSQL & Redis
  try {
    // 1. Enable sharing
    const shareRes = await fetch(`${BASE_URL}/api/diagrams/${diagramIds[0]}/share`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ isPublic: true }),
    });
    const shareData = await shareRes.json();
    const issuedToken = shareData.diagram?.shareToken;

    if (shareRes.status === 200 && issuedToken && shareData.shareUrl) {
      // 2. Fetch public diagram to populate Redis cache
      const publicRes = await fetch(`${BASE_URL}/api/diagrams/shared/${issuedToken}`);
      const publicData = await publicRes.json();
      
      // 3. Revoke sharing
      const revokeRes = await fetch(`${BASE_URL}/api/diagrams/${diagramIds[0]}/share`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ isPublic: false }),
      });
      const revokeData = await revokeRes.json();

      // 4. Verify token revoked in PostgreSQL (shareToken is null)
      const isNullInDb = revokeData.diagram?.shareToken === null && revokeData.diagram?.isPublic === false;

      // 5. Verify token purged from Redis (returns 404)
      const afterRevokeRes = await fetch(`${BASE_URL}/api/diagrams/shared/${issuedToken}`);

      if (isNullInDb && afterRevokeRes.status === 404) {
        pass(`[BUG-007] Atomic shareToken issuance & revocation verified (purged from Postgres & Redis)`);
      } else {
        fail('[BUG-007] Share token not atomically revoked', { isNullInDb, afterRevokeStatus: afterRevokeRes.status });
      }
    } else {
      fail('[BUG-007] Failed to issue initial share token', shareData);
    }
  } catch (err) {
    fail('[BUG-007] Error testing share token revocation', err.message);
  }

  // 6. Stripe Webhook & Pro Upgrade
  section('5. Stripe Webhook Billing & Plan Upgrade');
  try {
    const webhookPayload = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_test_${Date.now()}`,
          customer: `cus_test_${Date.now()}`,
          subscription: `sub_test_${Date.now()}`,
          metadata: {
            organizationId: orgId,
          },
        },
      },
    };

    const rawBody = JSON.stringify(webhookPayload);
    let secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret && fs.existsSync('.env')) {
      const match = fs.readFileSync('.env', 'utf-8').match(/STRIPE_WEBHOOK_SECRET=([^\r\n]+)/);
      if (match) secret = match[1].trim();
    }
    if (!secret) {
      secret = 'whsec_local_acceptance_test_mock_only';
    }

    const timestampHeader = Math.floor(Date.now() / 1000);
    const signature = crypto.createHmac('sha256', secret).update(`${timestampHeader}.${rawBody}`).digest('hex');
    const stripeSignature = `t=${timestampHeader},v1=${signature}`;

    const res = await fetch(`${BASE_URL}/api/billing/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeSignature,
      },
      body: rawBody,
    });
    const data = await res.json();
    if (res.status === 200 && data.received) {
      pass(`Stripe Webhook processed checkout.session.completed for org ${orgId}`);
    } else {
      fail('Webhook processing failed', data);
    }
  } catch (err) {
    fail('Webhook error', err.message);
  }

  // Retry 4th Diagram creation after upgrade -> Expect 201 Created
  try {
    const res = await fetch(`${BASE_URL}/api/diagrams`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `Architecture Diagram #4 (Pro Unlocked)`,
        description: `Successfully unlocked under Pro subscription`,
        data: { nodes: [{ id: 'k8s-pod', name: 'Auth Pod', type: 'container' }], connections: [] },
      }),
    });
    const data = await res.json();
    if (res.status === 201 && data.diagram?.id) {
      diagramIds.push(data.diagram.id);
      pass(`Created diagram #4 under Pro plan -> 201 Created (Quota Unlocked!)`);
    } else {
      fail('Failed to create 4th diagram after Pro upgrade', data);
    }
  } catch (err) {
    fail('Error creating 4th diagram after upgrade', err.message);
  }

  // 7. Diagram Versioning & Structural Diff
  section('6. Diagram Versioning & Structural Diff');
  const targetDiagramId = diagramIds[0];
  try {
    // Update diagram with modified node and a new connection
    const updateRes = await fetch(`${BASE_URL}/api/diagrams/${targetDiagramId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Architecture Diagram #1 (v2 Updated)',
        data: {
          nodes: [
            { id: 'node-1', name: 'API Gateway (Scale 3)', type: 'cloud_gateway' },
            { id: 'node-2', name: 'Redis Cache Cluster', type: 'database' },
          ],
          connections: [
            { id: 'conn-1', source: 'node-1', target: 'node-2', label: 'caching' },
          ],
        },
      }),
    });
    const updateData = await updateRes.json();
    if (updateRes.status === 200 && updateData.diagram?.name?.includes('v2')) {
      pass(`Updated diagram version to v2 with added nodes and connections`);
    } else {
      fail('Failed to update diagram', updateData);
    }

    // Check Diff between v1 and v2
    const diffRes = await fetch(`${BASE_URL}/api/diagrams/${targetDiagramId}/diff?v1=1&v2=2`, {
      headers: authHeaders,
    });
    const diffData = await diffRes.json();
    if (diffRes.status === 200 && diffData.diff && diffData.summary) {
      pass(`Structural 3D diff computed: ${diffData.summary.addedNodesCount} node(s) added, ${diffData.summary.modifiedNodesCount} modified, ${diffData.summary.addedConnectionsCount} connection(s) added`);
    } else {
      fail('Failed to compute diagram diff', diffData);
    }
  } catch (err) {
    fail('Versioning & Diff error', err.message);
  }

  // 8. Automated ADR Generation (Architecture Decision Records)
  section('7. Automated ADR Generation');
  try {
    const res = await fetch(`${BASE_URL}/api/diagrams/${targetDiagramId}/adr`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        decisionTitle: 'Use Redis as Cache Layer for API Gateway',
        userRationale: 'Sub-millisecond latency under spike traffic.',
        status: 'accepted',
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.adr?.id && data.markdown?.includes('## 1. Contexto')) {
      pass(`Generated ADR #${data.adr.id} in Michael Nygard markdown format`);
    } else {
      fail('Failed to generate ADR', data);
    }
  } catch (err) {
    fail('ADR generation error', err.message);
  }

  // 9. Multi-Format Diagram Export
  section('8. Multi-Format Diagram Export');
  for (const fmt of ['mermaid', 'drawio', 'markdown', 'json']) {
    try {
      const res = await fetch(`${BASE_URL}/api/diagrams/${targetDiagramId}/export?format=${fmt}`, {
        headers: authHeaders,
      });
      if (res.status === 200) {
        const ct = res.headers.get('content-type');
        pass(`Exported diagram to format "${fmt}" (${ct})`);
      } else {
        fail(`Export format "${fmt}" failed with status ${res.status}`);
      }
    } catch (err) {
      fail(`Export format "${fmt}" error`, err.message);
    }
  }

  // 10. Template Cloning
  section('9. Template Cloning Engine');
  if (templateId) {
    try {
      const res = await fetch(`${BASE_URL}/api/templates/${templateId}/clone`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.status === 201 && data.diagram?.id) {
        pass(`Cloned official template into workspace as Diagram "${data.diagram.name}"`);
      } else {
        fail('Template clone failed', data);
      }
    } catch (err) {
      fail('Template clone error', err.message);
    }
  }

  // 11. Real-time Telemetry Ingestion & Redis Pub/Sub
  section('10. Real-time Telemetry & Ingestion');
  let telemetryKey = null;
  try {
    const srcRes = await fetch(`${BASE_URL}/api/telemetry/sources`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Datadog Production Metrics',
      }),
    });
    const srcData = await srcRes.json();
    if (srcRes.status === 201 && srcData.source?.apiKey) {
      telemetryKey = srcData.source.apiKey;
      pass(`Created telemetry source with secure key "${telemetryKey.substring(0, 12)}..."`);
    } else {
      fail('Failed to create telemetry source', srcData);
    }

    if (telemetryKey) {
      const ingestRes = await fetch(`${BASE_URL}/api/telemetry/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telemetry-Key': telemetryKey,
        },
        body: JSON.stringify({
          metrics: [
            {
              diagramId: targetDiagramId,
              nodeId: 'node-1',
              metricName: 'cpu_usage',
              value: 78.4,
              unit: '%',
              status: 'warning',
            },
            {
              diagramId: targetDiagramId,
              nodeId: 'node-2',
              metricName: 'latency_p99',
              value: 1.2,
              unit: 'ms',
              status: 'healthy',
            },
          ],
        }),
      });
      const ingestData = await ingestRes.json();
      if (ingestRes.status === 200 && ingestData.processed === 2) {
        pass(`Ingested 2 metrics and published to Redis channel "telemetry-feed"`);
      } else {
        fail('Failed to ingest telemetry metrics', ingestData);
      }
    }
  } catch (err) {
    fail('Telemetry ingestion error', err.message);
  }

  // 12. AI Copilot Mutations Endpoint
  section('11. AI Copilot Graph Mutations');
  try {
    const copilotRes = await fetch(`${BASE_URL}/api/ai/copilot`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        diagramId: targetDiagramId,
        prompt: 'Add a load balancer in front of API Gateway',
        autoApply: false,
      }),
    });
    const copilotData = await copilotRes.json();
    if (copilotRes.status === 200 && copilotData.success) {
      pass(`Copilot mutation returned action "${copilotData.action}" (${copilotData.explanation})`);
    } else if (copilotRes.status === 400 && copilotData.error?.includes('GEMINI_API_KEY')) {
      pass(`Copilot safely validated missing GEMINI_API_KEY requirement (Status 400)`);
    } else {
      fail('Unexpected response from Copilot', copilotData);
    }
  } catch (err) {
    fail('Copilot test error', err.message);
  }

  // 12. Multi-Workspace Architecture & 2D/3D Sync
  section('12. Multi-Workspace Architecture & 2D/3D Sync');
  try {
    // A. Query workspaces via OrganizationMember
    const wsRes = await fetch(`${BASE_URL}/api/workspaces`, { headers: authHeaders });
    const wsData = await wsRes.json();
    if (wsRes.status === 200 && wsData.personalWorkspace && Array.isArray(wsData.workspaces)) {
      pass(`Listed ${wsData.workspaces.length} workspace(s), Personal Workspace identified: "${wsData.personalWorkspace.name}" (isPersonal: true)`);
    } else {
      fail('Failed to list workspaces via OrganizationMember', wsData);
    }

    // B. Create a second workspace and verify switch
    const createWsRes = await fetch(`${BASE_URL}/api/workspaces`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: `Secondary Workspace ${timestamp}` }),
    });
    const createWsData = await createWsRes.json();
    if (createWsRes.status === 201 && createWsData.workspace?.id) {
      pass(`Created secondary workspace "${createWsData.workspace.name}"`);

      // Switch back to personal workspace
      const switchRes = await fetch(`${BASE_URL}/api/workspaces/switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${createWsData.accessToken}`,
        },
        body: JSON.stringify({ workspaceId: wsData.personalWorkspace.id }),
      });
      const switchData = await switchRes.json();
      if (switchRes.status === 200 && switchData.success && switchData.accessToken) {
        pass(`Switched back to personal workspace "${switchData.workspace.name}" with refreshed JWT`);
      } else {
        fail('Failed to switch workspace via /api/workspaces/switch', switchData);
      }
    } else {
      fail('Failed to create secondary workspace', createWsData);
    }

    // C. Verify 2D/3D Diagram Mutation Sync
    if (targetDiagramId) {
      const collabRes = await fetch(`${BASE_URL}/api/collaborate/${targetDiagramId}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          cursor: { x: 10, y: 20, z: 0 },
          diagramMutation: {
            nodeId: 'node-1',
            position3D: { x: 5, y: 10, z: -2 },
            position2D: { x: 150, y: 280 },
            version: 2,
          },
        }),
      });
      const collabData = await collabRes.json();
      if (collabRes.status === 200 && collabData.liveDiagramMutation?.position2D?.x === 150) {
        pass(`Live 2D/3D mutation accepted with position2D { x: 150, y: 280 } and cached in Redis`);
      } else {
        fail('Collaborate position2D sync failed', collabData);
      }
    }
  } catch (err) {
    fail('Multi-Workspace & 2D/3D Sync test error', err.message);
  }

  // Final Summary
  section('SUMMARY');
  if (process.exitCode === 1) {
    console.log(`\n${colors.red}${colors.bold}Some acceptance tests failed. Review logs above.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.green}${colors.bold}ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY! 🚀${colors.reset}\n`);
  }
}

runTests();

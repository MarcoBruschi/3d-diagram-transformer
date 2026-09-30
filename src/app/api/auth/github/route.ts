import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/server/db';
import { generateAccessToken, generateRefreshToken } from '@/lib/server/auth';
import { redis } from '@/lib/server/redis';

export const dynamic = 'force-dynamic';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

function getAppOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || (process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).host : new URL(req.url).host);
  const proto = req.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  return `${proto}://${host}`;
}

// GET /api/auth/github - Production-grade GitHub OAuth 2.0 flow & profile gateway
export async function GET(req: NextRequest) {
  try {
    const origin = getAppOrigin(req);
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const inviteParam = searchParams.get('invite');

    // 1. Check if GitHub OAuth is properly configured in environment
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      console.warn('[GitHub OAuth]: Credenciais GITHUB_CLIENT_ID ou GITHUB_CLIENT_SECRET ausentes no .env');
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('error', 'github_not_configured');
      loginUrl.searchParams.set(
        'message',
        'Autenticação com GitHub não configurada no servidor. Configure GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET.'
      );
      return NextResponse.redirect(loginUrl.toString());
    }

    // 2. Step 1: Redirect user to GitHub OAuth consent screen
    if (!code) {
      const redirectUri = `${origin}/api/auth/github`;
      const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
      githubAuthUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
      githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
      githubAuthUrl.searchParams.set('scope', 'read:user user:email');

      // Generate CSRF state token and pass invite if present
      const stateObj = {
        nonce: crypto.randomBytes(16).toString('hex'),
        invite: inviteParam || null,
      };
      const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64url');
      githubAuthUrl.searchParams.set('state', encodedState);

      const response = NextResponse.redirect(githubAuthUrl.toString());
      response.cookies.set('github_oauth_nonce', stateObj.nonce, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 600, // 10 minutes
      });
      return response;
    }

    // 3. Step 2: Validate state token CSRF protection
    let parsedState: { nonce?: string; invite?: string | null } = {};
    if (stateParam) {
      try {
        parsedState = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf8'));
      } catch {
        console.warn('[GitHub OAuth]: Estado OAuth com formato inválido');
      }
    }

    const cookieNonce = req.cookies.get('github_oauth_nonce')?.value;
    if (cookieNonce && parsedState.nonce && cookieNonce !== parsedState.nonce) {
      console.warn('[GitHub OAuth CSRF Error]: Nonce retornado não corresponde ao cookie');
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('error', 'oauth_csrf_invalid');
      loginUrl.searchParams.set('message', 'Falha na verificação de segurança CSRF do GitHub OAuth.');
      return NextResponse.redirect(loginUrl.toString());
    }

    // 4. Exchange authorization code for GitHub access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Falha ao obter token do GitHub (Status: ${tokenRes.status})`);
    }

    const tokenData = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || 'Token de acesso do GitHub inválido');
    }

    // 5. Fetch authenticated user profile from GitHub API
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': '3D-Diagram-Transformer-SaaS',
      },
    });

    if (!userRes.ok) {
      throw new Error(`Falha ao carregar perfil do GitHub (Status: ${userRes.status})`);
    }

    const profile = await userRes.json();
    const githubProviderId = String(profile.id);
    const githubLogin = profile.login || `github-user-${githubProviderId}`;
    const githubName = profile.name || githubLogin;
    let githubAvatar = profile.avatar_url || '';
    let githubEmail = profile.email;

    // If email is private in GitHub profile, fetch from emails API
    if (!githubEmail) {
      try {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': '3D-Diagram-Transformer-SaaS',
          },
        });
        if (emailsRes.ok) {
          const emails = await emailsRes.json();
          if (Array.isArray(emails)) {
            const primaryVerified = emails.find((e: any) => e.primary && e.verified);
            const verified = emails.find((e: any) => e.verified);
            githubEmail = primaryVerified?.email || verified?.email || emails[0]?.email;
          }
        }
      } catch (err) {
        console.warn('[GitHub OAuth]: Erro ao buscar e-mails privados:', err);
      }
    }

    if (!githubEmail) {
      // Fallback synthetic identifier if user has no public/verified email
      githubEmail = `${githubLogin}@users.noreply.github.com`;
    }

    if (!githubAvatar) {
      githubAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(githubName)}&backgroundColor=0284c7`;
    }

    // 6. Check for invite code to join existing organization
    let targetOrgId: string | null = null;
    let targetRole: 'admin' | 'editor' | 'viewer' = 'editor';
    const inviteCode = parsedState.invite || searchParams.get('invite');
    if (inviteCode) {
      let rawInvite = inviteCode.trim();
      try {
        const cached = await redis.get(`workspace:invite:${rawInvite}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.role && ['admin', 'editor', 'viewer'].includes(parsed.role)) {
            targetRole = parsed.role;
          }
        }
      } catch {}
      const roleMatch = rawInvite.match(/^inv_(admin|editor|viewer)_/);
      if (roleMatch) {
        targetRole = roleMatch[1] as 'admin' | 'editor' | 'viewer';
      }

      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawInvite);
      const inviteOrg = await prisma.organization.findFirst({
        where: isUuid
          ? { OR: [{ id: rawInvite }, { inviteToken: rawInvite }, { slug: rawInvite }] }
          : { OR: [{ inviteToken: rawInvite }, { slug: rawInvite }] },
      });
      if (inviteOrg) {
        targetOrgId = inviteOrg.id;
      }
    }

    // 7. Find or link user in database
    // Strategy: Look up first by provider + providerId (immutable GitHub identity), then by email
    let user = await prisma.user.findFirst({
      where: {
        provider: 'github',
        providerId: githubProviderId,
      },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: githubEmail },
      });
    }

    // If user does not exist, create personal organization and user account
    if (!user) {
      const cleanLogin = githubLogin.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'user';
      const randomSuffix = crypto.randomBytes(4).toString('hex');
      const orgSlug = `workspace-${cleanLogin}-${randomSuffix}`;
      const inviteToken = 'inv_' + crypto.randomBytes(16).toString('hex');

      // Always create the personal default workspace for the user
      const personalOrg = await prisma.organization.create({
        data: {
          name: `${githubName}'s Workspace`,
          slug: orgSlug,
          inviteToken,
          plan: 'free',
        },
      });

      const activeOrgId = targetOrgId || personalOrg.id;
      const activeRole = targetOrgId ? targetRole : 'admin';

      user = await prisma.user.create({
        data: {
          name: githubName,
          email: githubEmail,
          avatarUrl: githubAvatar,
          role: activeRole,
          provider: 'github',
          providerId: githubProviderId,
          organizationId: activeOrgId,
          emailVerified: true,
        },
      });

      // Default personal workspace membership
      await prisma.organizationMember.create({
        data: {
          organizationId: personalOrg.id,
          userId: user.id,
          role: 'admin',
          isDefault: true,
        },
      });

      // If registered with invite code, also add membership to the invited workspace
      if (targetOrgId) {
        await prisma.organizationMember.create({
          data: {
            organizationId: targetOrgId,
            userId: user.id,
            role: targetRole,
            isDefault: false,
          },
        });
      }
    } else {
      // Update existing user with fresh GitHub profile details and provider link
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: githubName,
          avatarUrl: githubAvatar || user.avatarUrl,
          provider: 'github',
          providerId: githubProviderId,
          emailVerified: true,
          ...(targetOrgId ? { organizationId: targetOrgId, role: targetRole } : {}),
        },
      });

      // Ensure personal workspace membership exists for legacy accounts
      const existingPersonal = await prisma.organizationMember.findFirst({
        where: { userId: user.id, isDefault: true },
      });
      if (!existingPersonal && user.organizationId) {
        await prisma.organizationMember.upsert({
          where: {
            uq_org_member: {
              organizationId: user.organizationId,
              userId: user.id,
            },
          },
          update: { isDefault: true },
          create: {
            organizationId: user.organizationId,
            userId: user.id,
            role: user.role,
            isDefault: true,
          },
        }).catch(() => {});
      }

      // If invite code provided for existing user, add membership to target workspace
      if (targetOrgId) {
        await prisma.organizationMember.upsert({
          where: {
            uq_org_member: {
              organizationId: targetOrgId,
              userId: user.id,
            },
          },
          update: { role: targetRole },
          create: {
            organizationId: targetOrgId,
            userId: user.id,
            role: targetRole,
            isDefault: false,
          },
        });
      }
    }

    // 8. Generate JWT tokens for SaaS session
    const tokenPayload = {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role as 'admin' | 'editor' | 'viewer',
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await generateRefreshToken(tokenPayload);

    // 9. Redirect to studio and configure session cookies
    const redirectUrl = new URL('/studio', origin);
    redirectUrl.searchParams.set('oauth_token', accessToken);
    redirectUrl.searchParams.set('provider', 'github');

    const response = NextResponse.redirect(redirectUrl);

    // Set session cookies
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.set('diag_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    // Clear ephemeral oauth nonce
    response.cookies.delete('github_oauth_nonce');

    return response;
  } catch (err: any) {
    console.error('[GitHub OAuth Error]:', err);
    const origin = new URL(req.url).origin;
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'github_oauth_failed');
    loginUrl.searchParams.set('message', err.message || 'Falha durante o login com GitHub.');
    return NextResponse.redirect(loginUrl.toString());
  }
}

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/server/db';
import { generateAccessToken, generateRefreshToken } from '@/lib/server/auth';
import { redis } from '@/lib/server/redis';

export const dynamic = 'force-dynamic';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

function getAppOrigin(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith('http')) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host;
  const proto = req.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  return `${proto}://${host}`;
}

// GET /api/auth/google - Production-grade Google OAuth 2.0 flow & SSO handler
export async function GET(req: NextRequest) {
  try {
    const origin = getAppOrigin(req);
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const inviteParam = searchParams.get('invite');

    // 1. Check if Google OAuth credentials exist
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.warn('[Google OAuth]: Credenciais GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET ausentes no .env');
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('error', 'google_not_configured');
      loginUrl.searchParams.set(
        'message',
        'Autenticação com Google não configurada no servidor. Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.'
      );
      return NextResponse.redirect(loginUrl.toString());
    }

    // 2. Step 1: Redirect user to Google consent screen
    if (!code) {
      const redirectUri = `${origin}/api/auth/google`;
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'openid email profile');
      googleAuthUrl.searchParams.set('access_type', 'offline');
      googleAuthUrl.searchParams.set('prompt', 'consent');

      // Generate CSRF state token and pass invite if present
      const stateObj = {
        nonce: crypto.randomBytes(16).toString('hex'),
        invite: inviteParam || null,
      };
      const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64url');
      googleAuthUrl.searchParams.set('state', encodedState);

      const response = NextResponse.redirect(googleAuthUrl.toString());
      response.cookies.set('google_oauth_nonce', stateObj.nonce, {
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
        console.warn('[Google OAuth]: Estado OAuth com formato inválido');
      }
    }

    const cookieNonce = req.cookies.get('google_oauth_nonce')?.value;
    if (cookieNonce && parsedState.nonce && cookieNonce !== parsedState.nonce) {
      console.warn('[Google OAuth CSRF Error]: Nonce retornado não corresponde ao cookie');
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('error', 'oauth_csrf_invalid');
      loginUrl.searchParams.set('message', 'Falha na verificação de segurança CSRF do Google OAuth.');
      return NextResponse.redirect(loginUrl.toString());
    }

    // 4. Exchange authorization code for Google token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${origin}/api/auth/google`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Falha ao obter token do Google (Status: ${tokenRes.status})`);
    }

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      throw new Error('Token de acesso do Google ausente');
    }

    // 5. Fetch authenticated user profile from Google API
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      throw new Error(`Falha ao carregar perfil do Google (Status: ${userRes.status})`);
    }

    const profile = await userRes.json();
    const googleProviderId = String(profile.id || profile.sub);
    const googleEmail = profile.email;
    const googleName = profile.name || profile.given_name || googleEmail?.split('@')[0] || 'Google User';
    const googleAvatar = profile.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleName)}&backgroundColor=0284c7`;

    if (!googleEmail) {
      throw new Error('Conta Google não retornou e-mail verificado.');
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
    let user = await prisma.user.findFirst({
      where: {
        provider: 'google',
        providerId: googleProviderId,
      },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: googleEmail },
      });
    }

    // If user does not exist, create personal organization and user account
    if (!user) {
      const cleanName = googleEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') || 'user';
      const randomSuffix = crypto.randomBytes(4).toString('hex');
      const orgSlug = `workspace-${cleanName}-${randomSuffix}`;
      const inviteToken = 'inv_' + crypto.randomBytes(16).toString('hex');

      // Always create the personal default workspace for the user
      const personalOrg = await prisma.organization.create({
        data: {
          name: `${googleName}'s Workspace`,
          slug: orgSlug,
          inviteToken,
          plan: 'free',
        },
      });

      const activeOrgId = targetOrgId || personalOrg.id;
      const activeRole = targetOrgId ? targetRole : 'admin';

      user = await prisma.user.create({
        data: {
          name: googleName,
          email: googleEmail,
          avatarUrl: googleAvatar,
          role: activeRole,
          provider: 'google',
          providerId: googleProviderId,
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
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: googleName,
          avatarUrl: googleAvatar || user.avatarUrl,
          provider: 'google',
          providerId: googleProviderId,
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
    redirectUrl.searchParams.set('provider', 'google');

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
    response.cookies.delete('google_oauth_nonce');

    return response;
  } catch (err: any) {
    console.error('[Google OAuth Error]:', err);
    const origin = new URL(req.url).origin;
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'google_oauth_failed');
    loginUrl.searchParams.set('message', err.message || 'Falha durante o login com Google.');
    return NextResponse.redirect(loginUrl.toString());
  }
}

import { NextResponse } from 'next/server'

const AUTH_COOKIE_NAME = 'mom_auth'
const GUEST_USAGE_COOKIE_NAME = 'mom_guest_usage'

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 180,
}

export async function POST() {
  const response = NextResponse.json({ ok: true, isLoggedIn: true })

  response.cookies.set(AUTH_COOKIE_NAME, '1', AUTH_COOKIE_OPTIONS)
  response.cookies.set(GUEST_USAGE_COOKIE_NAME, '0', AUTH_COOKIE_OPTIONS)

  return response
}

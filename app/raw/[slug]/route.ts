import { NextRequest, NextResponse } from 'next/server';
import { getScript } from '@/lib/scripts';

const UNIVERSAL_LOADER = `--[[
   _____                   _    _       _     
  / ____|                 | |  | |     | |    
 | (___   ___  _   _ _ __ | |__| |_   _| |__  
  \\___ \\ / _ \\| | | | '__||  __  | | | | '_ \\ 
  ____) | (_) | |_| | |   | |  | | |_| | |_) |
 |_____/ \\___/ \\__,_|_|   |_|  |_|\\__,_|_.__/ 
  Sour Hub Universal Loader — 100% Free & Keyless Forever
]]

local Players = game:GetService("Players")
local placeId = game.PlaceId

local gamesMap = {
    [13772394625] = "blade-ball-vanguard",
    [6931042565] = "vl-apex-hub",
    [6035872082] = "rivals-phantom",
    [9199655655] = "gakuran-fighter",
    [7265339759] = "redliner-kinetic",
}

print("[Sour Hub] Universal loader initializing...")
print("[Sour Hub] Place ID: " .. tostring(placeId))

local scriptSlug = gamesMap[placeId] or "orbit-farm"
print("[Sour Hub] Launching keyless module: " .. scriptSlug)

local success, err = pcall(function()
    loadstring(game:HttpGet("https://sourhub.vercel.app/raw/" .. scriptSlug))()
end)

if not success then
    warn("[Sour Hub] Execution notice: " .. tostring(err))
end
`;

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (params.slug === 'loader' || params.slug === 'universal') {
    return new NextResponse(UNIVERSAL_LOADER, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  const script = await getScript(params.slug);

  if (!script) {
    return new NextResponse('-- Script not found\n', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new NextResponse(script.code, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

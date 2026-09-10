export interface UniversalLoaderConfig {
  code: string;
  version: string;
  enabled: boolean;
  updatedAt: string;
}

export const DEFAULT_LOADER_CODE = `--[[
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

if success then
    -- Report execution only after the loader starts successfully
    local HttpService = game:GetService("HttpService")
    pcall(function()
        local req = (syn and syn.request) or (http and http.request) or http_request or request
        if req and HttpService then
            req({
                Url = "https://sourhub.vercel.app/api/executions",
                Method = "POST",
                Headers = {
                    ["Content-Type"] = "application/json"
                },
                Body = HttpService:JSONEncode({
                    placeId = game.PlaceId,
                    universeId = game.GameId,
                    sessionId = HttpService:GenerateGUID(false)
                })
            })
        end
    end)
else
    warn("[Sour Hub] Execution notice: " .. tostring(err))
end
`;

export const DEFAULT_LOADER_CONFIG: UniversalLoaderConfig = {
  code: DEFAULT_LOADER_CODE,
  version: '2.5.0',
  enabled: true,
  updatedAt: '2026-09-10',
};

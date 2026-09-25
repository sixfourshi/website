--[[
  _   _                 _    _       _     
 | \ | |               | |  | |     | |    
 |  \| | _____   ____ _| |__| |_   _| |__  
 | . ` |/ _ \ \ / / _` |  __  | | | | '_ \ 
 | |\  | (_) \ V / (_| | |  | | |_| | |_) |
 |_| \_|\___/ \_/ \__,_|_|  |_|\__,_|_.__/ 
  Nova Hub Universal Loader — 100% Free & Keyless Forever
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

print("[Nova Hub] Universal loader initializing...")
print("[Nova Hub] Place ID: " .. tostring(placeId))

local scriptSlug = gamesMap[placeId] or "orbit-farm"
print("[Nova Hub] Launching keyless module: " .. scriptSlug)

local success, err = pcall(function()
    loadstring(game:HttpGet("https://novaxhub.vercel.app/raw/" .. scriptSlug))()
end)

if success then
    -- Report execution only after the loader starts successfully
    local HttpService = game:GetService("HttpService")
    pcall(function()
        local req = (syn and syn.request) or (http and http.request) or http_request or request
        if req and HttpService then
            req({
                Url = "https://novaxhub.vercel.app/api/executions",
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
    warn("[Nova Hub] Execution notice: " .. tostring(err))
end

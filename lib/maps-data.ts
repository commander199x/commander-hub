export interface MapEntry {
  name: string;
  description: string;
  image: string;
  file: string;
}

// TODO: once this grows past a few hundred entries, move this to a database
// or a headless CMS and fetch it in app/downloads/page.tsx instead of
// importing a static array. The search/pagination logic below doesn't need
// to change either way — only where `maps` comes from.
export const maps: MapEntry[] = [
    {
    name: "Commander Twilight",
    description: "Snow Twilight 4v4 Created and Edited By Missile and Commander.",
    image: "/downloads/maps/Commander Twilight.png",
    file: "/downloads/maps/Commander Twilight.zip",
  },
    {
    name: "Commander Twilight V2",
    description: "Twilight 4v4 Created and Edited By Missile and Commander. ",
    image: "/downloads/maps/commander twilight v2.png",
    file: "/downloads/maps/commander twilight v2.zip",
  },
  {
    name: "South Lebanon جنوب لبنان",
    description: "Competitive 4v4 city map, last_v2 balance pass.",
    image: "/downloads/maps/southlebanon.png",
    file: "/downloads/maps/southlebanon.zip",
  },
  {
    name: "Abandoned",
    description:
      "An abandoned industrial site in the middle of snowy weather. Two supply docks in the middle of the map, scattered crates with free tanks, and a bridge crossing to contest tech buildings.",
    image: "/downloads/maps/abandoned.png",
    file: "/downloads/maps/abandoned.zip",
  },
  {
    name: "Total Confrontation",
    description: "Close quarters 1v1 map.",
    image: "/downloads/maps/CQTotalConfrontation.png",
    file: "/downloads/maps/CQTotalConfrontation.zip",
  },
  {
    name: "4v4citylast_v2",
    description: "A city map designed for multiplayer gameplay, featuring an AI system.",
    image: "/downloads/maps/4v4citylast_v2.png",
    file: "/downloads/maps/4v4citylast_v2.zip",
  },
  {
    name: "8fan2zh",
    description: "An 8-player test map — unbalanced center, but fun for a 2v2v2v2. Free to edit.",
    image: "/downloads/maps/8fan2zh.png",
    file: "/downloads/maps/8fan2zh.zip",
  },
  {
    name: "Backwoods",
    description:
      "Rolling countryside at sunrise. A centrally located military camp and tactically placed outposts set up exciting fights.",
    image: "/downloads/maps/Backwoods.png",
    file: "/downloads/maps/Backwoods.zip",
  },
  {
    name: "ChampionsArena",
    description: "An even battlefield built for learning combat fundamentals and base control.",
    image: "/downloads/maps/ChampionsArena.png",
    file: "/downloads/maps/ChampionsArena.zip",
  },
  {
    name: "COOP GLA vs CHI - Call of Dragon ZH",
    description:
      "Custom scripted co-op mission. 1–2 human players as GLA against a China AI. Capture the flag to call reinforcements before China takes it back, then build up and destroy the Chinese forces.",
    image: "/downloads/maps/COOPGLAvsCHI-CallofDragonZH.png",
    file: "/downloads/maps/COOPGLAvsCHI-CallofDragonZH.zip",
  },
  {
    name: "FinalDestinyv1",
    description: "Close quarters 1v1 map.",
    image: "/downloads/maps/FinalDestinyv1.png",
    file: "/downloads/maps/FinalDestinyv1.zip",
  },
  {
    name: "GreenLands",
    description: "Close quarters 1v1 map.",
    image: "/downloads/maps/GreenLands.png",
    file: "/downloads/maps/GreenLands.zip",
  },
  {
    name: "hitandrunstrategymap",
    description: "Close quarters 1v1 map.",
    image: "/downloads/maps/hitandrunstrategymap.png",
    file: "/downloads/maps/hitandrunstrategymap.zip",
  },
  {
    name: "MapTemplate200x300",
    description: "Close quarters 1v1 map.",
    image: "/downloads/maps/MapTemplate200x300.png",
    file: "/downloads/maps/MapTemplate200x300.zip",
  },
  {
    name: "MapTemplate400x400",
    description: "Close quarters 1v1 map.",
    image: "/downloads/maps/MapTemplate400x400.png",
    file: "/downloads/maps/MapTemplate400x400.zip",
  },
  {
    name: "OilDeadEndv1",
    description: "Close quarters 1v1 map.",
    image: "/downloads/maps/OilDeadEndv1.png",
    file: "/downloads/maps/OilDeadEndv1.zip",
  },
  {
    name: "SaltyIslandbattlefield",
    description: "Close quarters 1v1 map.",
    image: "/downloads/maps/SaltyIslandbattlefield.png",
    file: "/downloads/maps/SaltyIslandbattlefield.zip",
  },
  {
    name: "Simple_Mediumdiff_AOD_NBA",
    description: "Close quarters 1v1 map.",
    image: "/downloads/maps/Simple_Mediumdiff_AOD_NBA.png",
    file: "/downloads/maps/Simple_Mediumdiff_AOD_NBA.zip",
  },
  {
    name: "StopCrying",
    description: "Close quarters 1v1 map.",
    image: "/downloads/maps/StopCrying.png",
    file: "/downloads/maps/StopCrying.zip",
  },
  {
    name: "TerraBellum",
    description: "Close quarters 1v1 map.",
    image: "/downloads/maps/TerraBellum.png",
    file: "/downloads/maps/TerraBellum.zip",
  },
  {
    name: "TheWorld",
    description: "Close quarters 1v1 map.",
    image: "/downloads/maps/TheWorld.png",
    file: "/downloads/maps/TheWorld.zip",
  },
  {
    name: "TwinsStrait",
    description: "Close quarters 1v1 map.",
    image: "/downloads/maps/TwinsStrait.png",
    file: "/downloads/maps/TwinsStrait.zip",
  },
];
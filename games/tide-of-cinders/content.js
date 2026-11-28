export const regions = [
 {name:"Wreckwater Reach",tag:"LANDING ZONE",desc:"The cracked hull of the Asterion bleeds heat into a slate sea.",tide:"crosswind",ground:"ash"},
 {name:"Brineglass Shelf",tag:"RESEARCH COAST",desc:"A glassy littoral where the tide leaves signals in the salt.",tide:"glass tide",ground:"salt"},
 {name:"The Cinder Keys",tag:"VOLCANIC CHAIN",desc:"Basalt vents keep the old survey buoys awake.",tide:"heat haze",ground:"basalt"},
 {name:"Morrow Shoals",tag:"EVACUATION CORRIDOR",desc:"A scattered refuge is calling through a failing relay.",tide:"black squall",ground:"shoal"},
 {name:"Vesper Shelf",tag:"DEEP CURRENT",desc:"Subsurface pressure has folded the landing platforms inward.",tide:"undertow",ground:"metal"},
 {name:"Sable Meridian",tag:"POWER BASIN",desc:"An abandoned geothermal array still draws from below.",tide:"steam rain",ground:"slag"},
 {name:"Nacre Expanse",tag:"BIOLOGICAL FRONT",desc:"The shore is changing faster than the colony can name it.",tide:"spore drift",ground:"living"},
 {name:"The Drowned Choir",tag:"ARCHIVE ISLANDS",desc:"Old beacon towers answer one another beneath the waterline.",tide:"echo fog",ground:"stone"},
 {name:"Pale Crown",tag:"COLONY SITE",desc:"A high ridge offers the first ground safe from the tide.",tide:"ice gale",ground:"ice"},
 {name:"Last Light Atoll",tag:"ENDGAME",desc:"The migration fleet waits beyond a horizon of storm-light.",tide:"storm surge",ground:"wreck"}
];
const raw = [
 ["Hull of the Asterion","Secure the split holdfast", "salvage","The landing team has minutes before the hull slips under."],
 ["Cold Start","Reignite the shore beacon","sabotage","A stolen transmitter is broadcasting the wrong coordinates."],
 ["Salt Index","Recover the tide-reader","salvage","Surveyor Ilya's instrument may explain the repeating signal."],
 ["Glassline","Trace the buried cable","sabotage","Something keeps cutting the colony's only data line."],
 ["Ash Tax","Silence the vent wardens","eliminate","The vents are being used as a territorial toll gate."],
 ["Red Weather","Hold the pump house","hold","Three cycles until the pressure pumps purge the brine."],
 ["Low Water Names","Find the missing cartographers","rescue","Two surveyors stopped checking in beneath the fog shelf."],
 ["Bell Buoy","Reclaim the northern chain","salvage","A beacon is still pulsing at a frequency nobody sent."],
 ["Morrow's Wake","Open a path through the shoals","sabotage","Hostile skiffs have mined the evacuation channel."],
 ["Quiet Passenger","Extract the refugee cutter","rescue","A family is sheltering inside a capsized atmospheric barge."],
 ["Pressure Debt","Restart the deep lift","salvage","Parts for a better settlement are trapped below the shelf."],
 ["The Folded Dock","Hold the platform","hold","The tide is bringing the platform back in pieces."],
 ["Sable Engine","Claim the geothermal station","salvage","A stubborn machine still has enough power for everyone."],
 ["Blackout Choir","Break the signal loop","sabotage","A tower network is luring ships toward the rocks."],
 ["Living Margin","Map the moving shoreline","hold","The coastline is migrating around the survey camp."],
 ["Borrowed Skin","Recover the sealed cultures","salvage","The colony's only viable seed vault is on the far spit."],
 ["Drowned Archive","Retrieve the landing ledger","salvage","The archive has the fleet's last usable descent data."],
 ["Antenna Crown","Defend the uplink","hold","The migration fleet has answered. Keep the uplink alive."],
 ["Pale Crownfall","Secure the ridge settlement","eliminate","A final hostile flotilla has reached the colony site."],
 ["Last Light","Light the departure chain","sabotage","Three beacons, one narrow launch window, no second chance."]
];
export const missions = raw.map((m,i)=>({id:i,name:m[0],objective:m[1],kind:m[2],brief:m[3],region:Math.floor(i/2),index:i,
 enemyCount: i===0?3:Math.min(7,3+Math.floor(i/3)), target: m[2]==="hold"?3:(m[2]==="rescue"?1:(m[2]==="eliminate"?Math.min(5,3+Math.floor(i/6)):2)),
 weather:regions[Math.floor(i/2)].tide, mapSeed: 901+i*337, reward:{scrap:3+i%3, rations:2+(i%2), cells:1+(i%3===0?1:0), intel:1+(i%4===0?1:0)}
}));
export const operatives = [
 {id:"voss",name:"Mara Voss",role:"RANGER",bio:"Surveyor. Never takes the same route twice.",hp:5,aim:0.78,range:6,skill:"Long sight"},
 {id:"oren",name:"Toma Oren",role:"BREACHER",bio:"Hull mechanic. Knows what pressure can do.",hp:6,aim:0.67,range:4,skill:"Hard cover"},
 {id:"saye",name:"Nia Saye",role:"MEDIC",bio:"Field surgeon, trained on the wrong planet.",hp:5,aim:0.70,range:5,skill:"Patch up"},
 {id:"kade",name:"Eli Kade",role:"TECH",bio:"Makes dead systems answer, briefly.",hp:5,aim:0.73,range:5,skill:"Field hack"},
 {id:"rhee",name:"Jun Rhee",role:"SCOUT",bio:"Moves with the tide, not against it.",hp:4,aim:0.76,range:5,skill:"Quick step"},
 {id:"bel",name:"Ada Bel",role:"HEAVY",bio:"A quiet voice behind a loud coilgun.",hp:7,aim:0.63,range:6,skill:"Suppress"},
 {id:"ilya",name:"Ilya Sen",role:"PATHFINDER",bio:"Lost a ship. Kept its map.",hp:5,aim:0.75,range:5,skill:"Tide sense"},
 {id:"sol",name:"Sol Ardent",role:"ENGINEER",bio:"The colony's last licensed electrician.",hp:5,aim:0.69,range:5,skill:"Rationer"}
];
export const branches = [
 {id:"fieldcraft",name:"FIELDCRAFT",sub:"Keep people alive",items:["Salt-proof wraps","Controlled breathing","Tidewise route","Clean extraction","Second wind","Homebound protocol","Quiet approach","Storm discipline","Shared burden","No one left"]},
 {id:"logistics",name:"LOGISTICS",sub:"Make every crate count",items:["Salvage ledger","Dry storage","Modular kits","Shore depots","Recycled cells","Relay economy","Pressure seals","Route priority","Reserve cache","Common stock"]},
 {id:"signals",name:"SIGNALS",sub:"Read the hidden coast",items:["Spectrum sweep","Ghost ping","Enemy silhouettes","Shortwave net","Counterfeit mark","Wideband listen","Predictive chart","Tide cipher","Fleet handshake","Open channel"]}
];
export const milestones = [
 "First footing","Shore beacon relit","Salt index recovered","Glassline traced","Ash Tax ended","Pump house held","Cartographers found","Bell Buoy reclaimed","Morrow passage opened","Refugees extracted","Deep lift restarted","Folded dock secured","Sable engine claimed","Blackout loop broken","Living margin mapped","Seed cultures recovered","Archive ledger retrieved","Antenna crown defended","Pale ridge secured","Departure chain lit","Three operations cleared","Five operations cleared","Ten operations cleared","First branch invested","Five doctrine rungs","Four operations supplied","Clean extraction","No retreat","Eight shore records","A world made home"
];
export const adversaries = [
 {name:"Tide Runners",role:"FLANKER",hp:3,range:4,style:"seek exposed sides"},
 {name:"Silt Guard",role:"ANCHOR",hp:5,range:5,style:"hold cover and contest ground"},
 {name:"Signal Thief",role:"DISRUPTOR",hp:3,range:5,style:"disable objectives"},
 {name:"Brine Stalker",role:"HUNTER",hp:4,range:3,style:"close fast on isolated crew"},
 {name:"Warden",role:"COMMAND",hp:6,range:6,style:"support the nearest ally"}
];
export const gear = ["Seal-skin mantle","Surveyor's optic","Magnet line","Folded barricade","Rescue beacon","Pressure patch","Signal knife","Longline carbine","Shock net","Tide chart","Spare cell","Hull key"];
export const discoveries = ["Asterion hull mark","Glass tide notation","Vent choir pattern","Cartographer's slate","Morrow family token","Lift pressure log","Sable engine stamp","Nacre bloom sample","Drowned fleet ledger","Crown descent code","Atoll launch window","Old Earth seed packet"];
export const facilities = ["Landing holdfast","Shore beacon","Salvage bench","Pressure pump","Refugee berth","Deep lift","Geothermal array","Seed vault","Archive tower","Fleet uplink"];

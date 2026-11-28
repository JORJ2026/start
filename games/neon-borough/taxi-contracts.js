const tiers=['I','II','III','IV','V'];
const bonuses=[8,12,16,21,28];
const families=[
 {type:'rush',name:'Beat the Bell',goals:['Finish the trip in 100 seconds','Finish the trip in 85 seconds','Finish the trip in 72 seconds','Finish the trip in 60 seconds','Finish the trip in 50 seconds'],thresholds:[100,85,72,60,50]},
 {type:'smooth',name:'Silk Ride',goals:['Avoid all car collisions','Avoid all car collisions','Avoid all car collisions','Avoid all car collisions','Avoid all car collisions'],thresholds:[0,0,0,0,0]},
 {type:'explore',name:'See Baybell',goals:['Visit 1 map zone with your passenger','Visit 2 map zones with your passenger','Visit 3 map zones with your passenger','Visit 4 map zones with your passenger','Visit 5 map zones with your passenger'],thresholds:[1,2,3,4,5]},
 {type:'direct',name:'No Detours',goals:['Drive no more than 2.5× the direct route','Drive no more than 2.2× the direct route','Drive no more than 2× the direct route','Drive no more than 1.8× the direct route','Drive no more than 1.6× the direct route'],thresholds:[2.5,2.2,2,1.8,1.6]},
 {type:'longhaul',name:'Long Haul',goals:['Drive at least 300 m with your passenger','Drive at least 500 m with your passenger','Drive at least 700 m with your passenger','Drive at least 900 m with your passenger','Drive at least 1100 m with your passenger'],thresholds:[300,500,700,900,1100]},
 {type:'pedestrian',name:'Good Neighbor',goals:['Keep the ride pedestrian-safe','Keep the ride pedestrian-safe','Keep the ride pedestrian-safe','Keep the ride pedestrian-safe','Keep the ride pedestrian-safe'],thresholds:[0,0,0,0,0]},
 {type:'heat',name:'No Trouble',goals:['Finish without attracting police heat','Finish without attracting police heat','Finish without attracting police heat','Finish without attracting police heat','Finish without attracting police heat'],thresholds:[0,0,0,0,0]},
 {type:'streak',name:'Golden Streak',goals:['Maintain a 1-ride clean streak','Maintain a 2-ride clean streak','Maintain a 3-ride clean streak','Maintain a 4-ride clean streak','Maintain a 5-ride clean streak'],thresholds:[1,2,3,4,5]},
 {type:'fare',name:'Big Meter',goals:['Earn a $18 base fare','Earn a $22 base fare','Earn a $26 base fare','Earn a $30 base fare','Earn a $34 base fare'],thresholds:[18,22,26,30,34]},
 {type:'patience',name:'Keep Them Smiling',goals:['Arrive before patience runs out','Arrive with 75 seconds of patience','Arrive with 60 seconds of patience','Arrive with 45 seconds of patience','Arrive with 30 seconds of patience'],thresholds:[1,75,60,45,30]}
];
export const taxiContracts=families.flatMap(family=>family.goals.map((objective,tier)=>({id:family.type+'-'+tier,type:family.type,name:family.name+' '+tiers[tier],objective,threshold:family.thresholds[tier],bonus:bonuses[tier]})));

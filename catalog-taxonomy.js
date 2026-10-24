const FORMA_CATEGORY_GROUPS=[
 {id:'pisos',label:'Pisos',all:'Ver todos los pisos',items:[['pisos-spc-click','Piso flotante SPC Click'],['pisos-autoadhesivos','Piso autoadhesivo']]},
 {id:'paredes',label:'Paredes',all:'Ver todas las paredes',items:[['pared-interior','Pared interior'],['pared-exterior','Pared exterior'],['wpc-envarillados','WPC envarillados']]},
 {id:'acabados',label:'Símiles y texturas',all:'Ver todos los acabados',items:[['simil-marmol','Símil mármol'],['simil-madera','Símil madera'],['simil-piedra','Símil piedra']]},
 {id:'autoadhesivos',label:'Autoadhesivos',all:'Ver todos los autoadhesivos',items:[['rollos-3d','Rollos 3D'],['vinilos','Vinilos']]},
 {id:'cielorrasos',label:'Cielorrasos',categoryLabel:'Cielorrasos PVC',all:'Ver todos los cielorrasos',items:[]},
 {id:'vidrios-esmerilados',label:'Vidrios',categoryLabel:'Vidrios esmerilados',all:'Ver vidrios esmerilados',items:[]},
 {id:'complementos',label:'Complementos',all:'Ver todos los complementos',items:[['terminaciones','Terminaciones y zócalos'],['adhesivos','Adhesivos'],['antigolpes','Alfombras antigolpes']]}
];
const FORMA_CATEGORY_LABELS={todos:'Todos los productos',rollos:'Rollos'};
for(const group of FORMA_CATEGORY_GROUPS){FORMA_CATEGORY_LABELS[group.id]=group.categoryLabel||group.label;for(const [id,label] of group.items)FORMA_CATEGORY_LABELS[id]=label;}
const formaCategoryNormal=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function formaResolveCategory(value){
 if(!value||value==='Todos')return 'todos';
 if(FORMA_CATEGORY_LABELS[value])return value;
 const aliases={'muros y paredes':'paredes','paneles wpc':'wpc-envarillados','piedra y texturas':'simil-piedra','vidrios':'vidrios-esmerilados','vidrios y esmerilados':'vidrios-esmerilados','terminaciones y accesorios':'complementos','terminaciones y adhesivos':'complementos','cielorrasos pvc':'cielorrasos','vinilos y rollos':'rollos','piso':'pisos'};
 const n=formaCategoryNormal(value);
 return aliases[n]||Object.keys(FORMA_CATEGORY_LABELS).find(id=>formaCategoryNormal(FORMA_CATEGORY_LABELS[id])===n)||'todos';
}
function formaCategoryLabel(value){return FORMA_CATEGORY_LABELS[formaResolveCategory(value)]||'Todos los productos';}
function formaCategoryMatches(p,value){
 const id=formaResolveCategory(value),tags=p.catalog_categories||[];
 if(id==='todos')return true;
 const unions={paredes:['pared-interior','pared-exterior','wpc-envarillados'],acabados:['simil-marmol','simil-madera','simil-piedra'],complementos:['terminaciones','adhesivos','antigolpes']};
 return unions[id]?unions[id].some(tag=>tags.includes(tag)):tags.includes(id);
}
function formaCatalogHref(id,prefix=''){return prefix+'tienda.html'+(id==='todos'?'':'?category='+encodeURIComponent(id))+'#productos';}

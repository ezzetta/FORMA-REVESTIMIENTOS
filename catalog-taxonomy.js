const FORMA_CATEGORY_GROUPS=[
 {id:'aplicacion',label:'Aplicación',categoryLabel:'Por aplicación',all:'Ver todas las aplicaciones',items:[['pisos','Pisos'],['paredes','Paredes'],['cielorrasos','Cielorrasos'],['vidrios-esmerilados','Vidrios']]},
 {id:'uso',label:'Uso',categoryLabel:'Por uso',all:'Ver todos los usos',items:[['interior','Interior'],['exterior','Exterior']]},
 {id:'sistema',label:'Sistema',categoryLabel:'Por sistema',all:'Ver todos los sistemas',items:[['autoadhesivos','Autoadhesivos'],['rigidos','Rígidos']]},
 {id:'acabados',label:'Acabado',categoryLabel:'Por acabado',all:'Ver todos los acabados',items:[['simil-marmol','Símil mármol'],['simil-madera','Símil madera'],['simil-piedra','Símil piedra'],['simil-cemento','Símil cemento']]},
 {id:'otros-productos',label:'Otros productos',categoryLabel:'Otros productos',all:'Ver otros productos',items:[]}
];
const FORMA_CATEGORY_LABELS={todos:'Todos los productos',rollos:'Rollos'};
for(const group of FORMA_CATEGORY_GROUPS){FORMA_CATEGORY_LABELS[group.id]=group.categoryLabel||group.label;for(const [id,label] of group.items)FORMA_CATEGORY_LABELS[id]=label;}
const formaCategoryNormal=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function formaResolveCategory(value){
 if(!value||value==='Todos')return 'todos';
 if(FORMA_CATEGORY_LABELS[value])return value;
 const aliases={'muros y paredes':'paredes','paneles wpc':'paredes','piedra y texturas':'simil-piedra','vidrios':'vidrios-esmerilados','vidrios y esmerilados':'vidrios-esmerilados','terminaciones y accesorios':'todos','terminaciones y adhesivos':'todos','complementos':'todos','cielorrasos pvc':'cielorrasos','vinilos y rollos':'autoadhesivos','rollos':'autoadhesivos','piso':'pisos','pisos-spc-click':'pisos','pisos-autoadhesivos':'autoadhesivos','pared-interior':'paredes','pared-exterior':'exterior','wpc-envarillados':'paredes','terminaciones':'todos','adhesivos':'todos','antigolpes':'otros-productos'};
 const n=formaCategoryNormal(value);
 return aliases[n]||Object.keys(FORMA_CATEGORY_LABELS).find(id=>formaCategoryNormal(FORMA_CATEGORY_LABELS[id])===n)||'todos';
}
function formaCategoryLabel(value){return FORMA_CATEGORY_LABELS[formaResolveCategory(value)]||'Todos los productos';}
function formaCategoryMatches(p,value){
 const id=formaResolveCategory(value),tags=p.catalog_categories||[];
 if(id==='todos')return true;
 const unions={
  aplicacion:['pisos','pared-interior','pared-exterior','cielorrasos','vidrios-esmerilados'],
  paredes:['pared-interior','pared-exterior'],
  uso:['interior','exterior'],
  sistema:['autoadhesivos','rigidos'],
  acabados:['simil-marmol','simil-madera','simil-piedra','simil-cemento']
 };
 return unions[id]?unions[id].some(tag=>tags.includes(tag)):tags.includes(id);
}
function formaCatalogHref(id,prefix=''){return prefix+'tienda.html'+(id==='todos'?'':'?category='+encodeURIComponent(id))+'#productos';}

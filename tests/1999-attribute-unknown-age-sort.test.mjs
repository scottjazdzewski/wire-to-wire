import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const script=readFileSync(new URL('../public/next/1999-attribute-ranking.js',import.meta.url),'utf8');
const sandbox={window:{}};
vm.runInNewContext(script,sandbox,{filename:'1999-attribute-ranking.js'});
const render=sandbox.window.WTW1999AttributeRanking.render;
const horses=[
 {name:'Unknown Age'},{name:'Yearling'},{name:'Newborn'},
 {name:'Blank Age'}
];
const ages={'Unknown Age':null,'Yearling':1,'Newborn':0,'Blank Age':''};
const adapter={
 horseAttributeGroups:[{name:'Test',definitions:[{key:'raw_speed',label:'Speed'}]}],
 stableHorseAttributes:()=>({raw_speed:0.5}),
 sourceFacts:name=>({age:ages[name],sex:'COLT',racing_status:'ACTIVE'})
};
const safe=v=>String(v??'');
const display=desc=>render({horses,adapter,
 app:{stableSearch:'',stableAttributeSort:'age',stableAttributeDesc:desc},
 ownerBadge:()=>'',safe});
const names=html=>[...html.matchAll(/class="ng-rs-horse"><span>([^<]+)<\/span>/g)].map(x=>x[1]);

test('ascending age sorting keeps real newborn age zero distinct from unknown age',()=>{
 assert.deepEqual(names(display(false)),['Newborn','Yearling','Blank Age','Unknown Age']);
 assert.match(display(false),/class="ng-rs-horse"><span>Newborn<\/span><\/button><\/td><td>0<\/td>/);
});

test('descending age sorting also places missing ages last and does not mutate source',()=>{
 assert.deepEqual(names(display(true)),['Yearling','Newborn','Blank Age','Unknown Age']);
 assert.equal(ages['Unknown Age'],null);
 assert.equal(ages['Blank Age'],'');
});

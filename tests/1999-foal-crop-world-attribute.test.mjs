import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const generator=read('public/1999/engine/full-world-generator.mjs');
const api=read('public/1999/engine/local-api.mjs');
const ui=read('public/next/next.js');
const source=read('public/next/1999-ui-source.mjs');
const html=read('public/next/index.html');

test('1999 expanded foal forecast is not mistaken for 1999 opening racehorses',()=>{
 assert.match(generator,/ANNUAL_FOAL_CROP_TARGET=45000,MARE_BREEDING_STOCK=60000/);
 assert.match(generator,/const sireCount=1400,damCount=26000/);
 assert.match(generator,/healthyRange:\{min:40000,max:50000\}/);
 assert.match(generator,/racehorsePopulationIsAnnualFoalCrop:false/);
 assert.match(generator,/basis:'SIMULATED_1999_EXPECTATION_NOT_LIVE_BIRTHS'/);
 assert.match(api,/w\.annualFoalingForecast\(\)/);
 assert.match(ui,/Number\(window\.__WTW_1999_UI_DATA__\?\.counts\?\.breedingMares\|\|0\)/);
});

test('World rankings compute a selected trait across the entire indexed population',()=>{
 assert.match(generator,/function horseAttributeAt\(index,key\)/);
 assert.match(generator,/return traits\(\[def\],seed,meta\.id,ability\)\[def\.key\]/);
 assert.match(api,/p==='\/api\/1999\/sim\/horse-attribute'/);
 assert.match(source,/function scanWorldHorseTrait\(key\)/);
 assert.match(source,/globalHorseTraitScores\.set\(key,job\)/);
 assert.match(source,/const sortKey=sort==='attr:'\+selectedTrait&&selectedTrait\?sort/);
 assert.match(source,/\['attr:'\+selectedTrait\]:h\['attr:'\+selectedTrait\]/);
 assert.match(ui,/data-ng-select="world-attribute"/);
 assert.match(ui,/APP\.departmentSortKey=field\.value\?'attr:'\+field\.value:'name'/);
 assert.match(ui,/worldAttributeKey:''/);
});

test('Sales inventory remains empty until genuine auction entries are supplied',()=>{
 assert.match(ui,/No catalog lots recorded for this view/);
 assert.match(ui,/No recorded private offers/);
 assert.match(html,/wtw1999-20261112-r\d+(?:-[a-z0-9-]+)?/);
});

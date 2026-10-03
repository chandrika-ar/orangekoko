import { test } from 'node:test';
import assert from 'node:assert/strict';
const { availableQuantity, normalizeCartLines, validatePurchase } = await import('../src/lib/commerce.ts').catch(() => ({}));
test('jewelry stays one-of-one; cards use stock or bounded preorder capacity', () => {
 assert.equal(availableQuantity({category:'necklaces',sold:false}),1);
 assert.equal(availableQuantity({category:'necklaces',sold:true}),0);
 assert.equal(availableQuantity({category:'handmade-cards',stock:6}),6);
 assert.equal(availableQuantity({category:'handmade-cards',stock:6,sold:true}),0);
 assert.equal(availableQuantity({category:'handmade-cards',fulfilment:'preorder',preorderCapacity:4}),4);
 assert.equal(availableQuantity({category:'handmade-cards'}),0);
});
test('duplicate requests aggregate and invalid quantities are rejected',()=>{
 assert.deepEqual(normalizeCartLines([{slug:'card',quantity:2},{slug:'card',quantity:1}]),[{slug:'card',quantity:3}]);
 for (const quantity of [0,-1,1.5,NaN,'3']) assert.throws(()=>normalizeCartLines([{slug:'card',quantity}]));
 assert.throws(()=>normalizeCartLines(Array.from({length:101},()=>({slug:'x',quantity:1}))));
});
test('purchase validates inventory and preorder dispatch date',()=>{
 assert.throws(()=>validatePurchase({category:'necklaces'},2));
 assert.throws(()=>validatePurchase({category:'handmade-cards',stock:2},3));
 assert.throws(()=>validatePurchase({category:'handmade-cards',fulfilment:'preorder',preorderCapacity:3},1));
 assert.throws(()=>validatePurchase({category:'handmade-cards',fulfilment:'preorder',preorderCapacity:3,dispatchBy:'2020-01-01'},1));
 assert.doesNotThrow(()=>validatePurchase({category:'handmade-cards',fulfilment:'preorder',preorderCapacity:3,dispatchBy:'2099-01-01'},2));
});
test('shipping keeps existing rates and never promises transit dates for preorders', async()=>{
 const { computeShippingOptions, toStripeShippingOptions } = await import('../src/lib/shipping.ts');
 assert.equal(computeShippingOptions(1000)[0].amountCents,990);
 assert.equal(computeShippingOptions(12000)[0].amountCents,0);
 assert.equal(computeShippingOptions(12000)[1].amountCents,2490);
 assert.ok(toStripeShippingOptions(1000,false)[0].shipping_rate_data.delivery_estimate);
 assert.equal(toStripeShippingOptions(1000,true)[0].shipping_rate_data.delivery_estimate,undefined);
});
test('cart caps jewelry at one, allows card packs, and clamps stock changes', async()=>{
 const storage=new Map();
 globalThis.window={localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}};
 const { useCartStore, cartSubtotalCents } = await import('../src/store/cart-store.ts');
 const item={productId:'jewel',slug:'jewel',title:'Jewel',priceCents:5000,currency:'EUR'};
 useCartStore.getState().clear();
 useCartStore.getState().addItem(item);useCartStore.getState().addItem(item);
 assert.equal(useCartStore.getState().lines[0].quantity,1);
 const card={...item,productId:'card',slug:'card',priceCents:800,maxQuantity:4};
 useCartStore.getState().addItem(card);useCartStore.getState().addItem(card);
 assert.equal(useCartStore.getState().lines[1].quantity,2);
 useCartStore.getState().setQuantity('card',99);assert.equal(useCartStore.getState().lines[1].quantity,4);
 useCartStore.getState().addItem({...card,maxQuantity:2});assert.equal(useCartStore.getState().lines[1].quantity,2);
 assert.equal(cartSubtotalCents(useCartStore.getState().lines),6600);
 useCartStore.getState().clear();
});
test('every locale provides matching card and shopping message keys', async()=>{
 const { readFile } = await import('node:fs/promises');
 const { readdir } = await import('node:fs/promises');
 const files=(await readdir(new URL('../messages/',import.meta.url))).filter(f=>f.endsWith('.json'));
 assert.equal(files.length,10);
 const english=JSON.parse(await readFile(new URL('../messages/en.json',import.meta.url),'utf8'));
 for(const file of files){
  const messages=JSON.parse(await readFile(new URL(`../messages/${file}`,import.meta.url),'utf8'));
  for(const namespace of ['cards','cardShop']){
   assert.deepEqual(Object.keys(messages[namespace]).sort(),Object.keys(english[namespace]).sort(),`${file}: ${namespace}`);
   for(const [key,value] of Object.entries(messages[namespace])) assert.ok(typeof value==='string' && value.trim(),`${file}: ${key}`);
  }
  assert.match(messages.cardShop.dispatchBy,/\{date\}/);
  assert.ok(messages.nav.handmadeCards);
 }
});
test('all ten locales consistently describe artisan-made jewelry rather than resale', async()=>{
 const { readFile, readdir }=await import('node:fs/promises');
 for(const file of (await readdir(new URL('../messages/',import.meta.url))).filter(f=>f.endsWith('.json'))){
  const text=await readFile(new URL(`../messages/${file}`,import.meta.url),'utf8');
  assert.doesNotMatch(text,/vintage|pre.?loved|second.?hand|patina|flea.market|estate.sale|中古|二手/i,file);
  const messages=JSON.parse(text);assert.ok(messages.home.craftNote);assert.ok(messages.product.maker);assert.ok(messages.product.craftTechnique);assert.ok(messages.product.madeIn);
  assert.deepEqual(Object.keys(messages.faq).sort(),Array.from({length:6},(_,i)=>[`q${i+1}`,`a${i+1}`]).flat().sort());
 }
});

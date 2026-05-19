// Programmatic tests for offer card render logic in detail.html
// Run with: node app/chat/detail.test.js

function renderOfferCardLogic({ offerStatus, convStatus, currentUserId, buyerId, offerSenderId, offerId }) {
  const isMine = offerSenderId === currentUserId;
  const isBuyer = buyerId === currentUserId;
  const status = offerStatus;
  const convClosed = convStatus === 'closed';
  const oid = offerId;

  const canRespond = !isMine && status === 'pending' && oid && !convClosed;
  const canPay = isBuyer && status === 'accepted' && oid && !convClosed;
  const waitingForPayment = !isBuyer && status === 'accepted' && oid && !convClosed;
  const payDone = status === 'accepted' && convClosed;

  return { canRespond, canPay, waitingForPayment, payDone };
}

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

const BUYER_ID = 'user-buyer-001';
const SELLER_ID = 'user-seller-002';
const OFFER_ID = 'offer-abc-123';

// ── Test 1: Buyer sends offer, seller accepts → buyer sees pay, seller sees waiting ──
console.log('\nTest 1: Buyer-sent offer, status=accepted, conv open');

const buyerView1 = renderOfferCardLogic({
  offerStatus: 'accepted', convStatus: 'open',
  currentUserId: BUYER_ID, buyerId: BUYER_ID,
  offerSenderId: BUYER_ID, offerId: OFFER_ID
});
assert('buyer canPay=true', buyerView1.canPay === true);
assert('buyer waitingForPayment=false', buyerView1.waitingForPayment === false);
assert('buyer canRespond=false', buyerView1.canRespond === false);

const sellerView1 = renderOfferCardLogic({
  offerStatus: 'accepted', convStatus: 'open',
  currentUserId: SELLER_ID, buyerId: BUYER_ID,
  offerSenderId: BUYER_ID, offerId: OFFER_ID
});
assert('seller canPay=false', sellerView1.canPay === false);
assert('seller waitingForPayment=true', sellerView1.waitingForPayment === true);
assert('seller canRespond=false', sellerView1.canRespond === false);

// ── Test 2: Seller sends offer (counter), buyer accepts → buyer sees pay, seller sees waiting ──
console.log('\nTest 2: Seller-sent offer, status=accepted, conv open');

const buyerView2 = renderOfferCardLogic({
  offerStatus: 'accepted', convStatus: 'open',
  currentUserId: BUYER_ID, buyerId: BUYER_ID,
  offerSenderId: SELLER_ID, offerId: OFFER_ID
});
assert('buyer canPay=true', buyerView2.canPay === true);
assert('buyer waitingForPayment=false', buyerView2.waitingForPayment === false);

const sellerView2 = renderOfferCardLogic({
  offerStatus: 'accepted', convStatus: 'open',
  currentUserId: SELLER_ID, buyerId: BUYER_ID,
  offerSenderId: SELLER_ID, offerId: OFFER_ID
});
assert('seller canPay=false', sellerView2.canPay === false);
assert('seller waitingForPayment=true', sellerView2.waitingForPayment === true);

// ── Test 3: Offer pending → neither sees pay button ──
console.log('\nTest 3: Offer status=pending');

const buyerView3 = renderOfferCardLogic({
  offerStatus: 'pending', convStatus: 'open',
  currentUserId: BUYER_ID, buyerId: BUYER_ID,
  offerSenderId: BUYER_ID, offerId: OFFER_ID
});
assert('buyer canPay=false when pending', buyerView3.canPay === false);
assert('buyer canRespond=false (own offer)', buyerView3.canRespond === false);

const sellerView3 = renderOfferCardLogic({
  offerStatus: 'pending', convStatus: 'open',
  currentUserId: SELLER_ID, buyerId: BUYER_ID,
  offerSenderId: BUYER_ID, offerId: OFFER_ID
});
assert('seller canRespond=true when pending', sellerView3.canRespond === true);
assert('seller canPay=false when pending', sellerView3.canPay === false);

// ── Test 4: Conv closed → payDone shown, no pay button ──
console.log('\nTest 4: Offer accepted, conv closed');

const buyerView4 = renderOfferCardLogic({
  offerStatus: 'accepted', convStatus: 'closed',
  currentUserId: BUYER_ID, buyerId: BUYER_ID,
  offerSenderId: BUYER_ID, offerId: OFFER_ID
});
assert('buyer canPay=false when closed', buyerView4.canPay === false);
assert('buyer payDone=true', buyerView4.payDone === true);
assert('buyer waitingForPayment=false when closed', buyerView4.waitingForPayment === false);

const sellerView4 = renderOfferCardLogic({
  offerStatus: 'accepted', convStatus: 'closed',
  currentUserId: SELLER_ID, buyerId: BUYER_ID,
  offerSenderId: BUYER_ID, offerId: OFFER_ID
});
assert('seller waitingForPayment=false when closed', sellerView4.waitingForPayment === false);
assert('seller payDone=true', sellerView4.payDone === true);

// ── Summary ──
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

//---DomReady---
(function(){
	var DomReady = window.DomReady = {};
	var userAgent = navigator.userAgent.toLowerCase();
	var browser = {
		version: (userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [])[1],
		safari: /webkit/.test(userAgent),
		opera: /opera/.test(userAgent),
		msie: (/msie/.test(userAgent)) && (!/opera/.test( userAgent )),
		mozilla: (/mozilla/.test(userAgent)) && (!/(compatible|webkit)/.test(userAgent))
	};	

	var readyBound = false;	
	var isReady = false;
	var readyList = [];
	
	function domReady() {
		if(!isReady) {
			isReady = true;	 
			if(readyList) {
				for(var fn = 0; fn < readyList.length; fn++) {
					readyList[fn].call(window, []);
				}
			
				readyList = [];
			}
		}
	};

	function addLoadEvent(func) {
		var oldonload = window.onload;
		if (typeof window.onload != 'function') {
		window.onload = func;
		} else {
		window.onload = function() {
			if (oldonload) {
			oldonload();
			}
			func();
		}
		}
	};

	function bindReady() {
		if(readyBound) {
			return;
		}
	
		readyBound = true;

		if (document.addEventListener && !browser.opera) {
			document.addEventListener("DOMContentLoaded", domReady, false);
		}

		if (browser.msie && window == top) (function(){
			if (isReady) return;
			try {
				document.documentElement.doScroll("left");
			} catch(error) {
				setTimeout(arguments.callee, 0);
				return;
			}
			domReady();
		})();

		if(browser.opera) {
			document.addEventListener( "DOMContentLoaded", function () {
				if (isReady) return;
				for (var i = 0; i < document.styleSheets.length; i++)
					if (document.styleSheets[i].disabled) {
						setTimeout( arguments.callee, 0 );
						return;
					}
				domReady();
			}, false);
		}

		if(browser.safari) {
			var numStyles;
			(function(){
				if (isReady) return;
				if (document.readyState != "loaded" && document.readyState != "complete") {
					setTimeout( arguments.callee, 0 );
					return;
				}
				if (numStyles === undefined) {
					var links = document.getElementsByTagName("link");
					for (var i=0; i < links.length; i++) {
						if(links[i].getAttribute('rel') == 'stylesheet') {
							numStyles++;
						}
					}
					var styles = document.getElementsByTagName("style");
					numStyles += styles.length;
				}
				if (document.styleSheets.length != numStyles) {
					setTimeout( arguments.callee, 0 );
					return;
				}
				domReady();
			})();
		}
		addLoadEvent(domReady);
	};
	DomReady.ready = function(fn, args) {
		bindReady();
		if (isReady) {
			fn.call(window, []);
		} else {
			readyList.push( function() { return fn.call(window, []); } );
		}
	};
	
	bindReady();
	
})();

function removeAccessTokenFromUrl() {
  const { history, location } = window
  const { search } = location
  if (search && search.indexOf('token') !== -1 && history && history.replaceState) {
    const cleanSearch = search.replace(/(\&|\?)token([_A-Za-z0-9=\.\-%]+)/g, '').replace(/^&/, '?');
    const cleanURL = location.toString().replace(search, cleanSearch);
    history.replaceState({}, '', cleanURL);
  }
}

const currentUrl = new URL(window.location);
const st_backend = "https://backend.shoptype.com";
const stLoginEvent = new Event('userLogin');
const stShoptypeInit = new Event('shoptypeInit');
const stCurrency = {"USD":"$", "INR":"₹","GBP":"£"};
const cssUrl = "https://cdn.jsdelivr.net/gh/shoptype/Shoptype-JS/shoptype.css";
const stLoadedProducts = {};
const cartUrl = "https://app.shoptype.com/cart";
const st_defaultCurrency = "USD";
const st_loadedJs = [];
let st_refUrl = null;
		currentPageProductId = null,
		stToken = currentUrl.searchParams.get("token"),
		stCheckoutType = "same",
		carts = {},
		stProducts = {},
		callStack={},
		state = 0,
		selectedCartId = null,
		checkout = null,
		cartMainFrame = null,
		vendorId = null,
		st_platformId = null,
		st_hostDomain = null,
		st_cartCountMatch = null,
		st_refCode = null,
		headerOptions = {
			method:'',
			'headers': {
				'Content-Type': 'application/json',
				'X-Shoptype-Api-Key': ""
			},	
			body: null
		};

DomReady.ready(function() { initShoptype(); });

if(stToken && stToken!=""){
	setCookie("stToken", stToken, 20);
	removeAccessTokenFromUrl();
}else{
	stToken = getCookie("stToken");
}

document.addEventListener("userLogin", function (e) {
	let userMenu = document.getElementById("menu-signout-btn");
	if(userMenu){
	  userMenu.innerHTML = "Sign out";
	  userMenu.setAttribute("onclick","shoptypeLogout()")
	}
});

function st_loadScript(url, callback) {
	var head = document.head;
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url;
	script.onreadystatechange = callback;
	script.onload = callback;
	head.appendChild(script);
	st_loadedJs.push(url);
}

function initShoptype(){
	let awakeTags = document.getElementsByTagName("awake");
	let awakeSetup = document.getElementsByTagName("awakesetup");

	if(awakeSetup.length>0){
		vendorId= awakeSetup[0].getAttribute("vendorid");
		st_platformId= awakeSetup[0].getAttribute("platformid");
		let apiKey = awakeSetup[0].getAttribute("apikey");
		let overrideCss = awakeSetup[0].getAttribute("css");
		st_cartCountMatch = awakeSetup[0].getAttribute("cartcountmatch");
		st_refCode = awakeSetup[0].getAttribute("refcode");
		st_hostDomain = awakeSetup[0].getAttribute("hostdomain");
		stCheckoutType = awakeSetup[0].getAttribute("checkoutin")??"same";
		st_refUrl = awakeSetup[0].getAttribute("refurl")??null;
		if(overrideCss){
			loadCSS(overrideCss);
		}else{
			loadCSS(cssUrl);
		}
		let body = document.getElementsByTagName('body')[0];
		let cartWraper = document.createElement("div");
		cartWraper.innerHTML = cartIframeHtml + 
								st_coseller_profile.replace("{site}", currentUrl.hostname) +
								cosellMask+
								st_cosell_screen.replace("{{site}}", currentUrl.host)+
								st_loader+st_checkout_done;		
		body.insertBefore(cartWraper, body.firstChild);
		cartMainFrame = document.getElementById("st-cart-iframe-block");
		headerOptions.headers["X-Shoptype-Api-Key"] = apiKey;
		setupCart();
		document.dispatchEvent(stShoptypeInit);
		for (var i = 0; i < awakeTags.length; i++) {
			let tagType = awakeTags[i].getAttribute("type");
			if(tagType){
				switch(tagType) {
					case 'cosellBtn':
						setupCosellBtn(awakeTags[i]);
						break;
					case 'buyBtn':
						setupBuyBtn(awakeTags[i], false);
						break;
					case 'buyNowBtn':
						setupBuyBtn(awakeTags[i], true);
						break;
					case 'profile':
						setupProfileBtn(awakeTags[i]);
						break;
					default:
						console.info(`Unknown Awake tag type`)
						awakeTags[i].remove;
						break;
				}
			}else{
				console.info(`type not defined`)
				awakeTags[i].remove;
			}
		}
		if(stToken && stToken!=""){
			getUserDetails();
		}
	}
}

function sendUserEvent(){
	let tid = currentUrl.searchParams.get("tid");
	if(!tid){return}
	if(typeof fingerprintExcludeOptions=== 'undefined'){
		st_loadScript("https://shoptype-scripts.s3.amazonaws.com/triggerUserEvent.js", sendUserEvent);
	}else{
		getDeviceId()
			.then(deviceId =>{
				let payload = {
					"device_id": deviceId,
					"url": window.location.href,
					"tracker_id": tid,
					"referrer": window.location.host
				}
				let headerOptions = {
					method:'post',
					'headers': {'content-type': 'application/json'},
					body: JSON.stringify(payload)
				};
				fetch(st_backend + "/track/user-event", headerOptions)
					.then(response=>response.json())
					.then(eventJson=>{
						console.info(eventJson);
					});
			});
	}
}
let st_loaderMask = `<div id="st-loader-mask" style="display:none" class="st-loader-mask"><div class="st-loader"></div></div>`;
let cosellMask = `<div id="st-cosell-mask" style="display:none" class="st-cosell-link-mask" onclick="hideElement(this)"><div class="st-cosell-links" onclick="event.stopPropagation()"><div class="st-cosell-links-header">Here’s your unique Cosell link!</div><div class="st-cosell-body"><div class="st-cosell-links-image"><img src="https://user-images.githubusercontent.com/4776769/164173060-33787091-37fc-45a9-b16e-2c3eb1fb82e7.png" loading="lazy" alt=""></div><div class="st-cosell-social-links"><div class="st-cosell-social-title">Share it on Social Media</div><div class="st-cosell-socialshare"> <a id="st-fb-link" href="#" class="st-cosell-socialshare-link w-inline-block"><img src="https://user-images.githubusercontent.com/4776769/164173335-e156685a-9be9-468f-9aef-145e4d6b8ee7.png" loading="lazy" alt=""></a> <a id="st-twitter-link" href="#" class="st-cosell-socialshare-link w-inline-block"><img src="https://user-images.githubusercontent.com/4776769/164174320-1234c471-5b69-473e-8b63-46b4d8f61189.png" loading="lazy" alt=""></a> <a id="st-whatsapp-link" href="#" class="st-cosell-socialshare-link w-inline-block"><img src="https://user-images.githubusercontent.com/4776769/164174179-5103826f-d131-4677-b581-031727195c0e.png" loading="lazy" alt=""></a> <a id="st-pinterest-link" href="#" class="st-cosell-socialshare-link w-inline-block"><img src="https://user-images.githubusercontent.com/4776769/164173344-e0f1fbe1-1ac0-4846-837b-97f47a556bf5.png" loading="lazy" alt=""></a> <a id="st-linkedin-link" href="#" class="st-cosell-socialshare-link w-inline-block"><img src="https://user-images.githubusercontent.com/4776769/164173350-af72f6b5-7926-42c6-abb4-c77b6db9da58.png" loading="lazy" alt=""></a></div></div><div class="st-cosell-links-txt">or</div><div class="st-cosell-sharelink"><div class="st-cosell-sharelink-div"><div class="st-cosell-sharelink-url"><div class="st-cosell-link-copy-btn" onclick="stCopyCosellUrl('st-cosell-url-input')">🔗 Copy to Clipboard</div> <input type="text" id="st-cosell-url-input" class="st-cosell-sharelink-url-txt"></input></div></div><div id="st-cosell-sharewidget" class="st-cosell-sharelink-div"><div class="st-cosell-share-widget-txt">Share on Blogs</div><div id="st-widget-btn" class="st-cosell-share-widget-btn">Get an Embed</div></div></div></div><div class="st-cosell-links-footer"><div class="st-cosell-footer-shoptype">Powered by <a href="https://www.shoptype.com" target="_blank" class="st-cosell-footer-shoptype-link">Shoptype</a></div> <a href="#" target="_blank" class="w-inline-block" style="display:none;"><div class="st-cosell-page-txt">Learn more about Coselling</div> </a></div></div></div>`;
let loginMask = `<div id="st-login-mask" style="display:none" class="st-login-mask"><div class="st-login-content"><div class="st-login-close-button" onclick="closeLogin()">X</div><div class="st-login-window"> <iframe id="st-loginIframe" src="https://login.shoptype.com/signin" width="400" height="600"></iframe></div></div></div>`; 
let cosellBtn = `<div class="st-cosell"><div id="st-product-cosell-button" class="st-product-cosell-button" onclick="showCosell()">COSELL</div></div><div class="st-cosell-note"><div id="st-cosell-earn1" class="st-cosell-text">NEW! - Earn up to $$$ every co-sale.<br>Rewarded with real money through attributions.</div></div>`;
let buyBtnHtml = `<div id="product-buy-button" class="st-product-buy-button" onclick="addToCart(this)">ADD TO CART</div>`;
let buyNowBtnHtml = `<div id="product-buy-button" class="st-product-buynow-button" onclick="stBuyNow(this)">BUY IT NOW</div>`;
let cartIframeHtml = `<div id="st-cart-iframe-block" style="display:none" class="st-cart-iframe-block"><div id="st-cart-close-button" class="st-cart-close-button" onclick="closeCart()">X</div><div class="st-cart-iframe"><div><div class="st-cart-state"><div id="st-state-cart" class="st-state-selected"></div><div id="st-state-line-1" class="st-state-line"></div><div id="st-state-del" class="st-state"></div><div id="st-state-line-2" class="st-state-line"></div><div id="st-state-pay" class="st-state"></div></div><div class="st-cart-progress"><div class="st-cart-state-test">Cart</div><div class="st-cart-state-test st-cart-center">Address</div><div class="st-cart-state-test">Pay &amp; Checkout</div></div></div><div><div class="st-cart-summary-title">SUMMARY</div><div class="st-cart-summary"><div><div class="st-cart-items-total"><div id="st-cart-summary-text" class="st-cart-summary-text">Items (0):</div><div id="st-selected-cart-total" class="st-cart-summary-val">0 USD</div></div><div class="st-cart-items-total"><div class="st-cart-summary-text">Shipping:</div><div id="st-all-carts-shipping" class="st-cart-summary-val">Address Required</div></div></div><div class="div-block-115"><div class="st-cart-summmary-tot">Total</div><div id="st-cart-total" class="st-cart-summmary-tot-val">0</div></div></div></div><div id="st-error-message" class="st-error-message">Error:</div><div id="st-cart-list" class="st-cart-list"><div id="st-vendor-cart-000" class="st-vendor-cart" onclick="selectCart(this)"><div class="st-cart-title"><div class="st-cart-radio-btn"><input type="radio" name="cartSelect" class="selectBtn"></div><h4 class="st-cart-store-name">Clubhouse Kim Cart</h4></div><div class="st-cart-products"><div id="st-cart-product-000" class="st-cart-product"><div class="st-cart-title"><div class="st-cart-image"><img src="https://d3e54v103j8qbb.cloudfront.net/plugins/Basic/assets/placeholder.60f9b1840c.svg" loading="lazy" alt="" class="st-cart-product-image"></div><div class="st-prod-del"><div><div class="st-cart-product-name">product name</div><div class="st-cart-product-brand">-</div></div><div class="st-product-price-quant"><div class="st-cart-prod-price"><div class="st-cart-prod-txt"><strong>Price: </strong></div><div class="st-cart-porduct-price">$00.00</div></div><div class="st-product-quant variant-select-2"><div class="st-product-minus" onclick="updateQuant(this,-1)">-</div><div class="st-cart-product-quant">1</div><div class="st-product-add" onclick="updateQuant(this,1)">+</div></div></div></div><img src="https://uploads-ssl.webflow.com/5fe2e58de64c87443f836b85/602ba124827ca0ca86e8e6a6_trash-can%201.svg" loading="lazy" alt="" class="st-cart-product-delete" onclick="removeProduct(this)"></div></div></div></div></div><div id="st-cart-deliver" class="st-cart-delivery"><div class="st-cart-summary-title">Delivery Details</div><div class="st-cart-delivery-details"><div class="st-cart-block-txt">Personal Details</div><div class="st-cart-form"> <input type="text" class="st-cart-input-field w-input" maxlength="256" name="name" data-name="Name" placeholder="Name" id="st-name"><input type="text" class="st-cart-input-field w-input" maxlength="256" name="email" data-name="email" placeholder="Email Address" id="st-email"><input type="text" class="st-cart-input-field w-input" maxlength="256" name="phone" data-name="phone" placeholder="Phone Number (Optional)" id="st-phone"><input type="text" class="st-cart-input-field w-input" maxlength="256" name="address1" data-name="address1" placeholder="Street Address 1" id="st-address"><input type="text" class="st-cart-input-field w-input" maxlength="256" name="address2" data-name="address2" placeholder="Street Address 2 (Optional)" id="st-address-2"><select id="st-country" name="country" data-name="country" class="st-select-field w-select"><option value="">Select a country...</option> </select><select id="st-state" name="state" data-name="state" class="st-select-field w-select"><option value="">Select a state...</option> </select><input type="text" class="st-cart-input-field w-input" maxlength="256" name="city" data-name="city" placeholder="City" id="st-city"><input type="text" class="st-cart-input-field w-input" maxlength="256" name="pincode" data-name="pincode" placeholder="Postal Code" id="st-pincode"></div></div></div><div id="st-cart-payment" class="st-cart-payment"><div id="st-vendor-shipping-000" class="st-vendor-shipping"><div id="shipping-mode" class="st-shipping-options-div"> <label for="name">Shipping Options</label> <select name="field" class="st-shipping-options"></select></div><div class="st-vendor-ship-product"><div class="st-cart-product-name">product name</div><div class="st-cart-product-no">0</div></div></div><div id="vcart-list"></div><div class="div-block-132"><div class="st-delivery-field"><div class="st-field-title">Name:</div><div id="shipping-name" class="st-field-value"></div></div><div class="st-delivery-field"><div class="st-field-title">phone</div><div id="shipping-phone" class="st-field-value"></div></div><div class="st-delivery-field"><div class="st-field-title">Email:</div><div id="shipping-email" class="st-field-value"></div></div><div class="st-delivery-field"><div class="st-field-title">Shipping Address:</div><div id="shipping-address" class="st-field-value"></div></div><div class="st-delivery-field"><div class="st-field-title">Billing Address:</div><div id="billing-address" class="st-field-value"></div></div></div></div><div class="st-cart-nav-bar"><div id="st-cart-back" class="st-cart-back" onclick="changeState(-1)">Back</div><div id="st-cart-next-btn" class="st-cart-next-btn" onclick="changeState(1)">Proceed to Delivery</div></div></div></div>`;
let st_cosellText = "NEW! - Earn up to {commission} every co-sale.<br/>Rewarded with real money through attributions.";
let st_cosell_screen = `<div class="st-cosell-link-mask" id="st-cosell-intro-mask" style="display:none" onclick="hideElement(this)"><div class="st-cosell-links" onclick="event.stopPropagation()"><div class="st-cosell-links-header" id="st-cosell-links-header">{{site}} is proud to introduce &quot;Cosell&quot; , A unique way to boost the influencer in you.<br><span class="st-cosell-links-header-span">Share and make Money Instantly.</span></div><div class="st-cosell-body"><div class="st-cosell-steps-div"><div class="st-cosell-exp"><div class="st-cosell-exp-header-div"><h3 class="st-cosell-exp-header">How to be a Coseller</h3></div><div class="st-cosell-exp-steps"><div class="st-cosell-step"><div class="st-cosell-step-no st-cosell-step-overlay">1</div><div class="st-cosell-step-img-div"><img src="https://user-images.githubusercontent.com/4776769/164172794-7618254d-eac2-4bd3-a7c2-5d5a12195b71.png" loading="lazy" alt="" class="st-cosell-step-img"></div><div class="st-cosell-step-title">Signup</div></div><div class="st-cosell-step"><div class="st-cosell-step-no st-cosell-step-overlay">2</div><div class="st-cosell-step-img-div"><img src="https://user-images.githubusercontent.com/4776769/164173181-bff98789-3c04-4448-a0d9-7f70ff24b800.png" loading="lazy" alt="" class="st-cosell-step-img"></div><div class="st-cosell-step-title">Click Cosell on cool products</div></div><div class="st-cosell-step"><div class="st-cosell-step-no st-cosell-step-overlay">3</div><div class="st-cosell-step-img-div"><img src="https://user-images.githubusercontent.com/4776769/164172794-7618254d-eac2-4bd3-a7c2-5d5a12195b71.png" loading="lazy" alt="" class="st-cosell-step-img"></div><div class="st-cosell-step-title">Share with your Network</div></div></div></div><div class="st-cosell-signup"><div class="st-cosell-sugnup-btn" onclick="showLogin()">Become a Coseller</div></div></div><div class="st-cosell-adv"><div class="st-cosell-step-pts"><div class="st-cosell-step-no">1</div><div class="st-cosell-step-txt">Coselling is Free, No membership fee.</div></div><div class="st-cosell-step-pts"><div class="st-cosell-step-no">2</div><div class="st-cosell-step-txt">Cosell across all participating Market Networks, across the Internet.</div></div><div class="st-cosell-step-pts"><div class="st-cosell-step-no">3</div><div class="st-cosell-step-txt">Cosell links are unique. Share, get paid when inviting others to grow your referral Network.</div></div></div></div><div class="st-cosell-links-footer"><div class="st-cosell-footer-shoptype">Powered by <a href="https://www.shoptype.com" target="_blank" class="st-cosell-footer-shoptype-link">Shoptype</a></div> <a href="#" target="_blank" class="st-link-block"><div class="st-cosell-page-txt">Learn more about Coselling</div> </a></div></div></div>`;
let st_coseller_profile = `<div class="st-cosell-link-mask" id="coseller-profile-mask" style="display:none" onclick="hideElement(this)"><div class="st-cosell-links" onclick="event.stopPropagation()"><div class="st-redirect"><div class="st-redirect-txt">To view earnings across all market networks, please visit:</div><div class="st-redirect-btn-div"> <a href="https://app.shoptype.com/" target="_blank" class="st-redirect-btn w-inline-block"><img src="https://user-images.githubusercontent.com/4776769/164174316-a309c175-ea8b-4ebb-946b-66c7ec487da3.png" loading="lazy" alt="" class="st-redirect-btn-image"><div class="st-redirect-btn-title">Visit Shoptype</div> </a><div class="st-redirect-btn-txt">(Redirects to Shoptype. Opens in new tab)</div></div></div><div class="st-coseller-db"><div class="st-coseller-db-title-div"><h1 id="st-coseller-db-heading" class="st-coseller-db-heading">Your Dashboard {site}</h1></div><div class="st-coseller-db-data"><div class="st-duration-selectors" style="display:none;"><div id="st-duration-select-all" class="st-duration-select st-btn-select">All Time</div><div id="st-duration-select-month" class="st-duration-select">This Month</div><div id="st-duration-select-week" class="st-duration-select">This Week</div><div id="st-duration-select-day" class="st-duration-select">Today</div></div><div class="st-coseller-kpi-div"><div class="div-block-137"><div class="st-coseller-kpi"><div class="st-coseller-kpi-txt">Total Earnings</div><div id="st-coseller-kpi-val-tot-earning" class="st-coseller-kpi-val">000</div></div><div class="st-coseller-kpi"><div class="st-coseller-kpi-txt">Clicks</div><div id="st-coseller-kpi-val-tot-click" class="st-coseller-kpi-val">000</div></div><div class="st-coseller-kpi"><div class="st-coseller-kpi-txt">Publishes</div><div id="st-coseller-kpi-val-tot-publish" class="st-coseller-kpi-val">000</div></div><div class="st-coseller-kpi"><div class="st-coseller-kpi-txt">Currency</div><div id="st-coseller-kpi-val-currency" class="st-coseller-kpi-val">USD</div></div></div><div class="st-coseller-kpi-products"><div><h3 class="st-coseller-products-title">Products Published</h3></div><div class="st-coseller-products-list" id="st-coseller-products-list"><div class="st-coseller-product" id="st-coseller-product-000" style="display: none;"><div class="st-coseller-product-div"><div class="st-coseller-product-details"><div class="st-coseller-product-img-div"><img src="https://d3e54v103j8qbb.cloudfront.net/plugins/Basic/assets/placeholder.60f9b1840c.svg" loading="lazy" alt="" class="st-coseller-product-img"></div><div class="st-coseller-product-desc"><div class="st-coseller-product-name">Product Name</div><div class="st-coseller-product-vendor">Vendor Name</div></div></div><div class="st-coseller-product-kpi"><div class="st-coseller-kpi-txt">Total Earnings</div><div class="st-coseller-kpi-val st-product-tot-earnings">$ 000</div></div></div><div class="div-block-146"><div class="st-coseller-product-kpi"><div class="st-coseller-kpi-txt">Product Price</div><div class="st-coseller-kpi-val">00</div></div><div class="st-coseller-product-kpi"><div class="st-coseller-kpi-txt">Clicks</div><div class="st-coseller-kpi-val">00</div></div><div class="st-coseller-product-kpi"><div class="st-coseller-kpi-txt">Publishes</div><div class="st-coseller-kpi-val">00</div></div><div class="st-coseller-product-kpi"><div class="st-coseller-nudge-btn">Cosell</div></div></div></div></div></div></div></div></div></div></div>`;
let st_profile_btn = `<div class="st-coseller-profile"><div class="st-coseller-profile-btn" onclick="stToggleElement('#st-coseller-profile-menu')"></div><div id="st-coseller-profile-menu" class="st-coseller-profile-menu" style="display:none;"><div class="st-profile-menu-item" onclick="stShowCosellerDashboard()">Profile</div><div class="st-profile-menu-item" onclick="stShowCosellerDashboard()">Coseller Dashboard</div><div class="st-profile-menu-item" id="menu-signout-btn" onclick="showLogin()">Sign in</div></div></div>`;
let st_loader = '<div class="st-loader-mask" id="st-loader-mask" style="display:none;"><img src="https://user-images.githubusercontent.com/4776769/164174322-56cec5d0-3c97-4fd5-8044-984abd030ed4.gif" alt="" style="max-width: 20%;"></div>';
let st_checkout_done = `<div class="st-cosell-link-mask" id="st-checkout-success" style="display:none" onclick="hideCheckoutMessage()"><div class="st-checkout-done"><h3 class="st-checkout-done-heading">Checkout Success!</h3><img src="https://user-images.githubusercontent.com/4776769/164174328-55acc731-8bfc-457f-9f5d-7616b4d49f7b.png?alt=media" loading="lazy" alt="" class="st-checkout-done-img"><div class="st-checkout-done-text">Thank you for shopping with us!You’ll be notified about your order in your notification inbox, as well as your registered email.</div></div></div>`;

function setupCosellBtn(awakeTag){
	const wraperDiv = document.createElement("div");
	wraperDiv.innerHTML = cosellBtn;
	let wraperWidth = awakeTag.getAttribute("width");
	if(wraperWidth && wraperWidth!=""){
		wraperDiv.style.width = wraperWidth;
	}
	awakeTag.parentNode.insertBefore(wraperDiv, awakeTag);
	let cosellBtnElem = wraperDiv.querySelector(".st-product-cosell-button");
	if(awakeTag.getAttribute("details")=="hidden"){
		let details = wraperDiv.querySelector(".st-cosell-note");
		details.style.display="none";
		details.style.position="absolute";
		details.style.width=wraperWidth;
		wraperDiv.querySelector(".st-cosell").style.borderRadius="10px";
	}

	getProductUrl(awakeTag,function(productJson){
			if(productJson==null){
				let stNoProduct =new CustomEvent('shoptypeNoProduct', {'detail': {
					"button": "cosell",
					"product_id": awakeTag.getAttribute("stproductid"),
					"ext_product_id": awakeTag.getAttribute("extproductid")
				}});
				wraperDiv.remove();
				document.dispatchEvent(stNoProduct);
				return;
			}
			cosellBtnElem.setAttribute("onclick","showCosell('"+productJson.id+"')");
			let btnTxt = awakeTag.getAttribute("btnTxt");
			let pricePrefix = stCurrency[productJson.currency]?" "+stCurrency[productJson.currency]:" " + productJson.currency;
			let commission = (productJson.variants[0].discountedPrice * productJson.productCommission.percentage)/100;
			if(btnTxt){
				btnTxt = btnTxt.replace("{commission}", pricePrefix + commission.toFixed(2));
				cosellBtnElem.innerHTML = btnTxt;
			}
			if(awakeTag.getAttribute("details")!="hidden"){
				st_cosellText = awakeTag.getAttribute("cosellText")??st_cosellText;
				wraperDiv.querySelector("#st-cosell-earn1").innerHTML = st_cosellText.replace("{commission}", pricePrefix + commission.toFixed(2));
			}
			awakeTag.remove();
			sendUserEvent();
		});
}

function autoOpen(){
	let openTabJson = sessionStorage['autoOpen'];

	if(openTabJson && openTabJson!=null && openTabJson!=""){
		let openOptions = JSON.parse(openTabJson);
		switch(openOptions.tab) {
			case 'Cosell':
			showCosell(openOptions.pid);
			break
			case 'CosellerDashboard':
			stShowCosellerDashboard();
			break
			default:
			break;
		}
	}
	sessionStorage.removeItem('autoOpen');
}

function setupBuyBtn(awakeTag, isBuyNow){
	const wraperDiv = document.createElement("div");
	let buyBtn = null;
	if(isBuyNow){
		wraperDiv.innerHTML = buyNowBtnHtml;
		buyBtn = wraperDiv.querySelector(".st-product-buynow-button");
	}else{
		wraperDiv.innerHTML = buyBtnHtml;
		buyBtn = wraperDiv.querySelector(".st-product-buy-button");
	}
	let btnTxt = awakeTag.getAttribute("btnTxt");
	if(btnTxt){
		buyBtn.innerHTML = btnTxt;
	}
	let wraperWidth = awakeTag.getAttribute("width");
	if(wraperWidth && wraperWidth!=""){
		wraperDiv.style.width = wraperWidth;
	}
	let quantitySelect = awakeTag.getAttribute("quantityselect");
	if(quantitySelect && quantitySelect!=""){
		buyBtn.setAttribute("quantitySelect",quantitySelect);
	}
	awakeTag.parentNode.insertBefore(wraperDiv, awakeTag);
	getProductUrl(awakeTag, function(productJson){
			if(productJson==null){
				let stNoProduct = new CustomEvent('shoptypeNoProduct', {'detail': {
					"button": "buyBtn",
					"product_id": awakeTag.getAttribute("stproductid"),
					"ext_product_id": awakeTag.getAttribute("extproductid")
				}});
				document.dispatchEvent(stNoProduct);
				wraperDiv.remove();
				return;
			}
			
			buyBtn.setAttribute("productid",productJson.id);
			buyBtn.setAttribute("variantid",productJson.variants[0].id);
			buyBtn.setAttribute("vendorid",productJson.catalogId);
			awakeTag.remove();
			sendUserEvent();
		});
}

function setupProfileBtn(awakeTag){
	const wraperDiv = document.createElement("div");
	wraperDiv.innerHTML = st_profile_btn;
	awakeTag.parentNode.insertBefore(wraperDiv, awakeTag);
}

function setProductId(productId){
	currentPageProductId = productId;
}

function fetchProduct(productKey, productUrl, callback){
	if(stLoadedProducts[productKey] && stLoadedProducts[productKey]!=null){
		callback(stLoadedProducts[productKey]);
	}else{
		if(callStack[productKey] && callStack[productKey]!=null){
			callStack[productKey].push(callback);
		}else{
			callStack[productKey] = [callback];
			fetch(productUrl)
				.then(response => response.json())
				.then(productJson => {
					if((!productJson.id) && !(productJson.products)){
						productJson = null;
					}
					if(productJson.products){
						productJson = productJson.products[0];
					}
					if(productJson!=null){
						stLoadedProducts[productKey] = productJson;
						if(productKey!=productJson.id){
							stLoadedProducts[productJson.id] = productJson;
						}
					}
					for (var i = 0; i < callStack[productKey].length; i++) {
						callStack[productKey][i](productJson);
					}
					callStack[productKey]=null;
				});
		}
	}
}

function getProductUrl(tag,callback){
	let stProductId = currentPageProductId??tag.getAttribute("stproductid");
	let extProductId = tag.getAttribute("extproductid");
	let productUrl = st_backend + "/products";
	if(stProductId && stProductId!=""){
		fetchProduct(stProductId, productUrl + "/" + stProductId, callback);
	}else{
		let extPId = "";
		if(extProductId && extProductId!=""){
			extPId = extProductId;
		}else if(typeof meta !== 'undefined'){//for Shopify product page
			extPId = meta.product.id;
		}
		fetchProduct(vendorId+"-"+extPId, productUrl + `?vendorId=${vendorId}&externalId=${extPId}`, callback);
	}
}

function addToCart(button, open = true){
	stShowLoader();
	let variantId = button.getAttribute("variantid");
	let productId = button.getAttribute("productid");
	let thisVendorId = button.getAttribute("vendorid");
	let quantity = 1;
	let quantSelect = button.getAttribute("quantitySelect");
	
	if (typeof stSelectedVariants === "function") { 
		let selectedOptions = [];
    	selectedOptions = stSelectedVariants();
    	let variant = getVariant(stLoadedProducts[productId], selectedOptions);
    	variantId = variant.id;
	}

	if (quantSelect && quantSelect!=""){
		quantity = parseInt(document.querySelector(quantSelect).value);
	}
	if(quantity==0){
		return;
	}
	addProduct(thisVendorId, productId, variantId, quantity)
	if(open){openCart();}
	return false;
}

function getVariant(product, selectedOptions){
	for (var i = 0; i < product.variants.length; i++) {
		let title = "";
		for (var j = 0; j < selectedOptions.length; j++) {
			if (product.variants[i].variantNameValue[selectedOptions[j].name] != selectedOptions[j].value) {
				break;
			}
			else {
				if(j < selectedOptions.length-1){
					continue;
				}
	        	return product.variants[i];
			}
		}
	}
	return product.variants[0];
}

function setupShare(product){
	headerOptions.method ='get';
	headerOptions.headers.Authorization = sessionStorage["token"];
	document.getElementById("st-cosell-sharewidget").style.display="none";
	fetch( st_backend+"/track/publish-slug?productId=" + product.id, headerOptions)
		.then(response => response.json())
		.then(trackerJson=>{
			let sharetxt = "Hey found this really interesting product you may be iterested in ";
			let params = removeParam("token", window.location.search);
			let refUrl = "";
			if(st_refUrl!=null){
				refUrl = st_refUrl.replace("{pid}", product.id);
				refUrl += refUrl.indexOf("?")<0?"?":"&";
				refUrl += "tid=" + trackerJson.trackerId;
			}else{
				refUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + insertParam("tid", trackerJson.trackerId, params);
			}
			let encodedUrl = encodeURIComponent(refUrl);
			document.getElementById("st-fb-link").href = "https://www.facebook.com/sharer/sharer.php?u="	+ encodedUrl;
			document.getElementById("st-whatsapp-link").href = "whatsapp://send?text=" + sharetxt + product.title + " " + encodedUrl;
			document.getElementById("st-twitter-link").href = "http://twitter.com/share?text=" + sharetxt + "&url="	+ encodedUrl;
			document.getElementById("st-pinterest-link").href = "https://pinterest.com/pin/create/link/?url=" + encodedUrl + "&media=" + product.primaryImageSrc.imageSrc + "&description=" + product.title;
			let description = product.description?product.description.substr(0,250):"";
			document.getElementById("st-linkedin-link").href = "https://www.linkedin.com/shareArticle?mini=true&source=LinkedIn&url=" + encodedUrl + "&title=" + product.title + "&summary=" + description;
			document.getElementById("st-cosell-url-input").value = refUrl;
		});
}

function insertParam(key, value, urlParams) {
    key = encodeURIComponent(key);
    value = encodeURIComponent(value);
    var kvp = urlParams.substr(1).split('&');
    let i=0;

    for(; i<kvp.length; i++){ 
        if(kvp[i]==""){
            kvp.pop(); 
            continue;
        }
        if (kvp[i].startsWith(key + '=')) {
            let pair = kvp[i].split('=');
            pair[1] = value;
            kvp[i] = pair.join('=');
            break;
        }
    }

    if(i >= kvp.length){
        kvp[kvp.length] = [key,value].join('=');
    }

    let params = kvp.join('&');
    return "?" + params;
}

function removeParam(key, sourceURL) {
    var rtn = sourceURL.split("?")[0],
        param,
        params_arr = [],
        queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
    if (queryString !== "") {
        params_arr = queryString.split("&");
        for (var i = params_arr.length - 1; i >= 0; i -= 1) {
            param = params_arr[i].split("=")[0];
            if (param === key) {
                params_arr.splice(i, 1);
            }
        }
        if (params_arr.length) rtn = rtn + "?" + params_arr.join("&");
    }
    return rtn;
}

function stCacheProduct(productJson){
	stLoadedProducts[productJson.id]=productJson;
}

function shoptypeLogout(){
	setCookie("stToken",null,0);
	sessionStorage.clear();
	location.reload();
	let cosellerMenu = document.getElementById("st-coseller-profile-menu");
	if(cosellerMenu){cosellerMenu.style.display="none";}
}

function showCosell(productId){
	if(!sessionStorage["userId"] || sessionStorage["userId"]==""){
		sessionStorage["autoOpen"] = '{"tab":"Cosell","pid":"'+productId+'"}';
		document.getElementById("st-cosell-intro-mask").style.display="flex";
	}else{
		stCallWithProduct(productId, setupShare);
		document.getElementById("st-cosell-mask").style.display="flex";
	}
}

function stCopyCosellUrl(elementID) {
	let copyText = document.getElementById(elementID);
	copyText.select();
	copyText.setSelectionRange(0, 99999); 
	document.execCommand("copy");
}
function loadCSS(cssUrl){
	let cssId = btoa(cssUrl);
	if (!document.getElementById(cssId))
	{
		let head	= document.getElementsByTagName('head')[0];
		let link	= document.createElement('link');
		link.id	 = cssId;
		link.rel	= 'stylesheet';
		link.type = 'text/css';
		link.href = cssUrl;
		link.media = 'all';
		head.appendChild(link);
	}
}
function showLogin(){
	let tid = currentUrl.searchParams.get("tid");

	if(stToken && stToken!=""){
		getUserDetails();
	}else{
		let loginUrl = 'https://login.shoptype.com/signup?redirectUrl=' + encodeURIComponent(window.location.href);
		if(tid){
			loginUrl += "&tid=" + tid;
		}else{
			loginUrl += "&rid=" + st_refCode;
		}
		window.location.replace(loginUrl);
	}
}
function getUserDetails(){
	headerOptions.method = "get";
	headerOptions.headers.Authorization = stToken;
	fetch(st_backend + "/me",headerOptions)
		.then(response => response.json())
		.then(userJson => {
			sessionStorage['userId'] = userJson._id;
			sessionStorage['token'] = stToken;
			sessionStorage["userEmail"]=userJson.email;
			sessionStorage["userName"]=userJson.name;
			sessionStorage["userPhone"]=userJson.phone;
			document.dispatchEvent(stLoginEvent);
			autoOpen();
		});
}

function addClass(element, className){
	arr = element.className.split(" ");
	if (arr.indexOf(className) == -1) {
		element.className += " " + className;
	}
}

function removeClass(element, className){
	element.className = element.className.replace(className,"");	
}

function openCart(){
	cartMainFrame.style.display = "";
	cartMainFrame.style.right= "0px";
	moveToCart()
}
function closeCart(){
	checkout = null;
	cartMainFrame.style.right= "-"+cartMainFrame.offsetWidth+"px";
}
function changeState(stateProg){
	state+=stateProg;
	state = state>3?3:state;
	state = state<0?0:state;
	switch(state){
		case 0: 
		moveToCart();
		break;
		case 1: 
		moveToDelivery();
		break;
		case 2:
		moveToPayments();
		break;
		case 3:
		moveToPay();
		break;
	}
}
function moveToCart(){
	state = 0;
	document.getElementById("st-cart-list").style.display = "flex";
	document.getElementById("st-cart-deliver").style.display = "none";
	document.getElementById("st-state-del").className = "st-state";
	document.getElementById("st-state-cart").className = "st-state-selected";
	document.getElementById("st-cart-next-btn").innerHTML = "Proceed to Delivery";
	document.getElementById("st-cart-payment").style.display = "none";
	document.getElementById("st-all-carts-shipping").innerHTML = "Address Required";
	if(typeof fingerprintExcludeOptions=== 'undefined'){
		st_loadScript("https://shoptype-scripts.s3.amazonaws.com/triggerUserEvent.js", sendUserEvent);
	}
}
function moveToDelivery(){
	state = 1;
	stShowLoader();
	getDeviceId().
		then(deviceId=>{
		headerOptions.method = 'post';
		let data = {
			"deviceId": deviceId,
			"cartId": selectedCartId
		}
		headerOptions.body = JSON.stringify(data);
		headerOptions.headers['X-Shoptype-PlatformId']=st_platformId;
		fetch(st_backend + "/checkout", headerOptions)
			.then(response => response.json())
			.then(checkoutJson => {
				checkout = checkoutJson;
				checkout.id = checkoutJson.checkout_id;
				if(checkoutJson.message){
					stHideLoader();
					state--;
					showError(checkoutJson.message);
					moveToCart();
				}else if(checkout.external_url){
					let childWindow = null;
					let st_redirect_uri = checkout.redirect_uri;
					if(st_hostDomain && st_hostDomain!=""){
						let st_checkoutUrl = new URL(st_redirect_uri);
						st_redirect_uri = st_checkoutUrl.href.replace(st_checkoutUrl.host,st_hostDomain)
					}

					if(stCheckoutType == "newWindow"){
						childWindow = window.open(st_redirect_uri);
					}else{
						window.location.href = st_redirect_uri;						
					}

					if(!childWindow && stCheckoutType == "newWindow"){
						state--;
						showError("Unable to open Payment Window. This was blocked by the browser.");
					}else{
						closeCart();
					} 
				}else{
					cartMainFrame.style.display = "";
					cartMainFrame.style.right= "0px";
					setCountry();
					st_loadScript("https://shoptype-scripts.s3.amazonaws.com/payment_js/st-payment-handlers-bundle.js");
					st_loadScript("https://js.stripe.com/v3/");
					st_loadScript("https://checkout.razorpay.com/v1/checkout.js");
					stHideLoader();
					document.getElementById("st-cart-list").style.display = "none";
					document.getElementById("st-cart-deliver").style.display = "flex";
					document.getElementById("st-state-del").className = "st-state-selected";
					document.getElementById("st-state-del").style.backgroundColor = "#5377ab"; 
					document.getElementById("st-state-cart").className = "st-state";
					document.getElementById("st-state-cart").style.backgroundColor = "#5377ab";
					document.getElementById("st-state-line-1").style.backgroundColor = "#5377ab";
					document.getElementById("st-cart-next-btn").innerHTML = "Proceed to Payment";
					document.getElementById("st-cart-payment").style.display = "none";
					document.getElementById("st-all-carts-shipping").innerHTML = "Address Required";
				}
			});
		});
}
function moveToPayments(){
	state = 2;
	stShowLoader();
	headerOptions.method = "put";
	let countrySelect = document.getElementById("st-country");
	let stateSelect = document.getElementById("st-state");
	let checkoutBody = {
		"shipping_address": {
		"name": document.getElementById("st-name").value,
		"phone": document.getElementById("st-phone").value,
		"email": document.getElementById("st-email").value,
		"street1": document.getElementById("st-address").value+ " " + document.getElementById("st-address-2").value,
		"city": document.getElementById("st-city").value,
		"country": countrySelect.options[countrySelect.selectedIndex].text,
		"countryCode": countrySelect.value,
		"state": stateSelect.options[stateSelect.selectedIndex].text,
		"stateCode": stateSelect.value,
		"postalCode": document.getElementById("st-pincode").value
		},
		"is_shipping_billing": true
	};
	checkoutBody.billing_address = checkoutBody.shipping_address
	headerOptions.body = JSON.stringify(checkoutBody);
	fetch(st_backend + `/checkout/${checkout.id}/address`, headerOptions)
		.then(response => response.json())
		.then(checkoutJson => {
			stHideLoader();
			if(checkoutJson.error){
				state--;
				showError(checkoutJson.message);
			}else{
				checkout = checkoutJson;
				setupOrder();
			}
		});
}
function setupOrder(){
	document.getElementById("st-cart-deliver").style.display = "none";
	document.getElementById("st-cart-payment").style.display = "flex";
	document.getElementById("st-cart-next-btn").innerHTML = "Confirm & Pay";
	let orderKeys = Object.keys(checkout.order_details_per_vendor);
	let vCartList = document.getElementById("vcart-list");
	removeAllChildNodes(vCartList);
	if(checkout.requires_shipping){
		let shippingTemp = document.getElementById("st-vendor-shipping-000");
		for (var i = 0; i < orderKeys.length; i++) {
			let vShip = shippingTemp.cloneNode(true);
			vShip.id = "v"+orderKeys[i];
			let shippingField = vShip.querySelector(".st-shipping-options");
			vShip.style.display="block";
			vCartList.appendChild(vShip);
			let vendorsCart = checkout.order_details_per_vendor[orderKeys[i]];
			for (var j = 0; j < vendorsCart.shipping_options.length; j++) {
				let shipping = vendorsCart.shipping_options[j];
				let option = document.createElement("option");
				option.text = shipping.shipping_html;
				option.value = shipping.method_key;
				shippingField.add(option,orderKeys[i]);
			}
			shippingField.value = vendorsCart.shipping_selected.method_key;
			shippingField.setAttribute("vid",orderKeys[i])
			shippingField.addEventListener('change', () => {
				updateShipping(shippingField.value, shippingField.getAttribute("vid"));
			});	
			for (var j = 0; j < vendorsCart.cart_lines.length; j++) {
				let cProd = shippingTemp.querySelector(".st-vendor-ship-product").cloneNode(true);
				cProd.style.display = "flex";
				cProd.querySelector(".st-cart-product-name").innerHTML = vendorsCart.cart_lines[j].name;
				cProd.querySelector(".st-cart-product-no").innerHTML = vendorsCart.cart_lines[j].quantity;
				vShip.appendChild(cProd);
			}
		}
	}
	let curr = checkout.total.currency;
	let pricePrefix = stCurrency[curr]??curr;
	document.getElementById("st-selected-cart-total").innerHTML = pricePrefix + checkout.sub_total.amount
	document.getElementById("st-all-carts-shipping").innerHTML = pricePrefix + checkout.shipping.amount
	document.getElementById("st-cart-total").innerHTML = pricePrefix + checkout.total.amount
	document.getElementById("shipping-name").innerHTML = checkout.shipping_address.name;
	document.getElementById("shipping-phone").innerHTML = checkout.shipping_address.phone;
	document.getElementById("shipping-email").innerHTML = checkout.shipping_address.email;
	document.getElementById("shipping-address").innerHTML = checkout.shipping_address.street1 + ", " + checkout.shipping_address.city + ", " + checkout.shipping_address.state + ", " + checkout.shipping_address.country + " - " + checkout.shipping_address.postalCode;
	document.getElementById("billing-address").innerHTML = checkout.billing_address.street1 + ", " + checkout.billing_address.city + ", " + checkout.billing_address.state + ", " + checkout.billing_address.country + " - " + checkout.billing_address.postalCode;
}
function updateShipping(shippingKey){
	stShowLoader(1000);
	let orderKey = Object.keys(checkout.order_details_per_vendor);
	let shippingBody = `{
		"method_key_per_vendor": {
		"${orderKey[0]}": {
				"method_key": "${shippingKey}"
			}
		}
	}`;
	headerOptions.method = "put";
	headerOptions.body = shippingBody;
	fetch(st_backend + `/checkout/${checkout.id}/shipping-method`, headerOptions)
		.then(response => response.json())
		.then(checkoutJson => {
			stHideLoader();
			checkout = checkoutJson;
			setupOrder();
		});
}
function moveToPay(){
	cartMainFrame.style.right= "-400px";
	initSTPayment(checkout.id, st_backend, headerOptions.headers["X-Shoptype-Api-Key"], paymentComplete)
}
function paymentComplete(payload){
	switch(payload.status){
	case "failed":
		cartMainFrame.style.right= "0px";
		showError(payload.message);
		break;
	case "closed":
		if(selectedCartId){
			cartMainFrame.style.right= "0px";
		}
		break;
	case "success":
		deleteCart(selectedCartId);
		selectedCartId = null;
		showCheckoutSuccess();
		closeCart();
		break;
	}
}
function showCheckoutSuccess(){
	document.getElementById('st-checkout-success').style.display = "";
	setTimeout(hideCheckoutMessage, 5000);
}
function hideCheckoutMessage(){
	document.getElementById('st-checkout-success').style.display = "";
}
function deleteCart(cartId){
	headerOptions.method = "delete";
	headerOptions.body = null;
	fetch(st_backend + `/cart/${cartId}/`, headerOptions)
		.then(response => {
			console.info("Cart Deleted: " + response.status);
		});
}
function stBuyNow(button){
	stShowLoader();
	let variantId = button.getAttribute("variantid");
	let productId = button.getAttribute("productid");
	let quantity = 1;
	let quantSelect = button.getAttribute("quantitySelect");
	if (quantSelect && quantSelect!=""){
		quantity = parseInt(document.querySelector(quantSelect).value);
	}
	if(quantity==0){
		stHideLoader();
		return;
	}
	createCartAddProduct("BuyNow", productId, variantId, quantity, buyNowCheckout);
}
function buyNowCheckout(newCheckoutId){
	selectedCartId = newCheckoutId;
	delete carts.BuyNow;
	setCookie("carts", JSON.stringify(carts),100)
	moveToDelivery();
	let buyNowCart = document.getElementById(newCheckoutId);
	if(buyNowCart){buyNowCart.remove();}
}
function showError(errorMsg){
	let errorMsgBlk = document.getElementById("st-error-message");
	errorMsgBlk.addEventListener('onclick', function() {errorMsgBlk.style.display = "none"});
	errorMsgBlk.style.display = "block";
	errorMsgBlk.innerHTML = errorMsg;
	setTimeout(function(){ errorMsgBlk.style.display = "none"; }, 5000);
}
function doStuffOnUnload() {
	headerOptions.method = "get";
	headerOptions.body = null;
	fetch(st_backend + "/checkout/"+checkout.checkout_id, headerOptions)
		.then(response => response.json())
		.then(checkoutJson => {
			console.info(checkoutJson);
		});
}
function selectCart(cart){
	let pricePrefix = "";
	let tot = 0;
	var itemCount = 0;
	if(cart){
		cart.querySelector(".selectBtn").checked = true;
		selectedCartId = cart.id;
		let curr = cart.getAttribute("currency");
		tot = cart.getAttribute("total");
		pricePrefix = stCurrency[curr]??curr;
		itemCount = parseInt(cart.getAttribute("items"));
	}
	document.getElementById("st-selected-cart-total").innerHTML = pricePrefix + " " + tot;
	document.getElementById("st-cart-total").innerHTML = pricePrefix + " " + tot;
	document.getElementById("st-cart-summary-text").innerHTML = "Items ("+itemCount+"):";			

	let shoptypeCartCountChanged =new CustomEvent('shoptypeCartCountChanged', {'detail': {
		"count": itemCount
	}});
	document.dispatchEvent(shoptypeCartCountChanged);
	if(st_cartCountMatch){
		let countField = document.querySelector(st_cartCountMatch);
		if(countField){

			countField.innerHTML = '<span class="cart-count">'+itemCount+"</span>"
			if(itemCount>0){
				countField.classList.remove("hide")
			}else{
				countField.classList.add("hide")
			}
		}
	}
}
function addCart(cartId){
	headerOptions.method = 'get';
	headerOptions.body = null;
	fetch(st_backend + "/cart/" + cartId, headerOptions)
		.then(response => response.json())
		.then(cartJson => {
		if(cartJson.cart_lines && cartJson.cart_lines.length>0){
			let cartTemplate = document.getElementById("st-vendor-cart-000");
			let cartList=document.getElementById("st-cart-list");
			let newCart = cartTemplate.cloneNode(true);
			newCart.style.display = "block";
			newCart.setAttribute("id", cartId);
			newCart.querySelector(".st-cart-product").remove();
			newCart.querySelector(".selectBtn").setAttribute("value", cartJson.id);
			addCartProducts(cartJson, newCart);
			cartList.appendChild(newCart);
			selectCart(newCart);
		}
	});
}
function refreshCart(cartNode){
	let cartId = cartNode.id;

	headerOptions.method = 'get';
	headerOptions.body = null;
	fetch(st_backend + "/cart/" + cartId,headerOptions)
		.then(response => response.json())
		.then(cartJson => {
			removeAllChildNodes(cartNode.querySelector(".st-cart-products"));
			if(cartJson.cart_lines && cartJson.cart_lines.length>0){
				cartNode.style.display = "block";
				cartNode.setAttribute("id", cartId);
				addCartProducts(cartJson, cartNode);
				selectCart(cartNode);
			}else{
				selectCart(null);
				cartNode.remove();
			}
		});
}
function addCartProducts(cartJson, newCart){
	let productTemplate = document.getElementById("st-cart-product-000");
	let productsList = newCart.querySelector(".st-cart-products");
	let itemCount=0;
	if(cartJson.cart_lines.length>=1){
		newCart.querySelector(".st-cart-store-name").innerHTML = carts["shoptypeCart"]&&carts["shoptypeCart"]==cartJson.id?"Shoptype Cart":cartJson.cart_lines[0].vendor_name;
		newCart.setAttribute("total",cartJson.sub_total.amount);
		newCart.setAttribute("currency",cartJson.sub_total.currency);
		newCart.setAttribute("items",cartJson.cart_lines.length);
	}
	for (var i = 0; i < cartJson.cart_lines.length; i++) {
		let newProduct = productTemplate.cloneNode(true);
		let curr = stCurrency[cartJson.cart_lines[i].price.currency]?stCurrency[cartJson.cart_lines[i].price.currency]:cartJson.cart_lines[i].price.currency;
		newProduct.querySelector(".st-cart-product-delete").setAttribute("onclick","removeProduct(this)");
		newProduct.setAttribute("id", cartJson.cart_lines[i].product_id);
		newProduct.querySelector(".st-cart-product-name").innerHTML = cartJson.cart_lines[i].name;
		newProduct.querySelector(".st-cart-product-image").src = cartJson.cart_lines[i].image_src;
		newProduct.querySelector(".st-cart-porduct-price").innerHTML = curr + " " + cartJson.cart_lines[i].price.amount;
		newProduct.setAttribute("variantid",cartJson.cart_lines[i].product_variant_id);
		newProduct.setAttribute("productid",cartJson.cart_lines[i].product_id);
		newProduct.querySelector(".st-cart-product-quant").innerHTML = cartJson.cart_lines[i].quantity;
		itemCount += cartJson.cart_lines[i].quantity
		productsList.appendChild(newProduct);
	}
	newCart.setAttribute("items",itemCount);
}
function removeProduct(deleteButton){
	let productNode = deleteButton.parentNode.parentNode;
	let cartNode = productNode.parentNode.parentNode;
	let productId = productNode.getAttribute("productid");
	let variantId = productNode.getAttribute("variantid");
	let cartId = cartNode.id;
	updateProductQuant(cartId,productId,variantId,0);
}
let quantityChange = {};
let timeout;
function updateQuant(button, addValue){
	let productNode = button.parentNode.parentNode.parentNode.parentNode.parentNode;
	let cartNode = productNode.parentNode.parentNode;
	let productId = productNode.getAttribute("productid");
	let variantId = productNode.getAttribute("variantid");
	let quantity = parseInt(productNode.querySelector(".st-cart-product-quant").innerHTML);
	let cartId = cartNode.id;
	let productKey = cartId+productId+variantId;
	if(quantityChange[productKey] && quantityChange[productKey]!=null){
		quantityChange[productKey]+=addValue;
		clearTimeout(timeout);
	}else{
		quantityChange[productKey] = quantity+addValue;
	}
	button.parentNode.querySelector(".st-cart-product-quant").innerHTML = quantityChange[productKey];
	timeout = setTimeout(function(){
		let newCount = quantityChange[productKey];
		delete quantityChange[productKey];
		clearTimeout(timeout);
		updateProductQuant(cartId,productId,variantId,newCount);
	}, 500);
}

function updateProductQuant(cartId, productId, variantId, quantity){
	let payload = {
					"product_id": productId,
					"product_variant_id": variantId,
					"quantity": quantity
				}
	headerOptions.method = 'put';
	headerOptions.body = JSON.stringify(payload);
	stShowLoader();
	fetch(st_backend + "/cart/" + cartId,headerOptions)
		.then(response => response.json())
		.then(cartJson => {
			updateCart(cartId);
			stHideLoader();
		})
		.catch(err => console.info(err));
}
function setupCart(){
	let cartsString = getCookie("carts");
	if(cartsString && cartsString!=""){
		carts = JSON.parse(cartsString);
		let cartIds = Object.getOwnPropertyNames(carts)
		for (var i = 0; i < cartIds.length; i++) {
			addCart(carts[cartIds[i]]);
		}
	}
}
function addProduct(vendorId, productId, varientId, quantity){
	let currentCartId = null;
	stCallWithProduct(productId, function(productJson){
		let cVendorId = productJson.vendor.enableCheckoutShoptype?"shoptypeCart":vendorId;
		if(carts[cVendorId]){
			currentCartId = carts[cVendorId];
		}else if(carts["newCart"]){
			currentCartId = carts["newCart"];
		}else{
			createCartAddProduct(cVendorId, productId, varientId, quantity);
			return;
		}
		addProductToCart(currentCartId, productId, varientId, quantity);
	});
}
function updateCart(cartId){
	let cartNode = document.getElementById(cartId);
	if(cartNode){
		refreshCart(cartNode)
	}else{
		addCart(cartId);
	}
}
function addProductToCart(cartId, productId, varientId, quantity, callback){
	let payload = {
			"product_id": productId,
			"product_variant_id": varientId,
			"quantity": quantity
		};
	headerOptions.method = 'post';
	headerOptions.body = JSON.stringify(payload);
	fetch(st_backend + "/cart/" + cartId +"/add",headerOptions)
		.then(response => response.json())
		.then(cartJson => {
			if(callback && typeof(callback) == "function"){
				callback(cartJson.id)
			}
			updateCart(cartId);
			stHideLoader();
		})
		.catch(err => console.info(err));
}
function stShowCosellerDashboard(){
		if(!sessionStorage["userId"] || sessionStorage["userId"]==""){
			showLogin();
			sessionStorage["autoOpen"] = '{"tab":"CosellerDashboard"}';
		}
		else{
			document.getElementById('st-coseller-profile-menu').style.display="none";
			stAuthenticateCoseller(stToken);
		}
	}

function stAuthenticateCoseller(token){		
	headerOptions.method = 'POST';
	headerOptions.headers.Authorization = token;
	headerOptions.body = '{"userType": "coseller"}';

	fetch(st_backend + "/authenticate", headerOptions)
		.then(response => response.json())
		.then(authJson => {
			displayCosellerSummary(authJson.token);
			displayCosellerDetails(authJson.token);
			document.getElementById('coseller-profile-mask').style.display="flex";
		});
}

function displayCosellerSummary(token){
	headerOptions.headers.Authorization = token;
	headerOptions.body = '{userType: "coseller"}';
	headerOptions.method = 'get';
	headerOptions.body = null;
	fetch(st_backend + "/coseller-dashboard?viewType=cosellerView&currency=" + st_defaultCurrency, headerOptions)
		.then(response => response.json())
		.then(cosellerJson => {
			document.getElementById('st-coseller-kpi-val-tot-earning').innerHTML = cosellerJson.total_commissions;
			document.getElementById('st-coseller-kpi-val-tot-click').innerHTML = cosellerJson.total_clicks;
			document.getElementById('st-coseller-kpi-val-tot-publish').innerHTML = cosellerJson.total_publishes;
			document.getElementById('st-coseller-kpi-val-currency').innerHTML = cosellerJson.currency;
		});
}

function stCallWithProduct(productId, callback){
	if(stLoadedProducts[productId]){
		callback(stLoadedProducts[productId])
	}else{
		fetch(st_backend +"/products/"+productId)
		.then(response => response.json())
		.then(productJson => {
			stLoadedProducts[productId] = productJson;
			callback(productJson);
		});
	}
}

function displayCosellerDetails(token){
	headerOptions.headers.Authorization = token;
	headerOptions.body = '{userType: "coseller"}';
	headerOptions.method = 'get';
	headerOptions.body = null;
	fetch(st_backend + "/coseller-dashboard?viewType=cosellerProductView&count=20&offset=0&currency=" + st_defaultCurrency, headerOptions)
		.then(response => response.json())
		.then(cosellerJson => {
			let productList = document.getElementById("st-coseller-products-list");
			let productTemplate = document.getElementById("st-coseller-product-000");
			for (var i = 0; i < cosellerJson.length; i++) {
				let productClone=productTemplate.cloneNode(true);
				productClone.style.display="";
				productClone.querySelector(".st-coseller-product-img").src = cosellerJson[i].image_url;
				productClone.querySelector(".st-coseller-product-name").innerHTML = cosellerJson[i].title;
				productClone.querySelector(".st-coseller-product-vendor").innerHTML = cosellerJson[i].vendorName;
				let kpiValues = productClone.getElementsByClassName("st-coseller-kpi-val");
				kpiValues[0].innerHTML= cosellerJson[i].total_commissions;
				kpiValues[1].innerHTML= cosellerJson[i].price;
				kpiValues[2].innerHTML= cosellerJson[i].total_clicks;
				kpiValues[3].innerHTML= cosellerJson[i].total_publishes;
				productList.appendChild(productClone);
				productClone.querySelector(".st-coseller-nudge-btn").setAttribute("onclick","showCosell('"+cosellerJson[i].productId+"')")
			}
		});
}

function createCartAddProduct(vendorId, productId, varientId, quantity, callback){
	headerOptions.method = "post";
	headerOptions.body = "{}";
	fetch(st_backend + "/cart",headerOptions)
		.then(response => response.json())
		.then(cartJson => {
			carts[vendorId] = cartJson.id;
			setCookie("carts", JSON.stringify(carts),100)
			addProductToCart(cartJson.id, productId, varientId, quantity, callback);
		});
}
function setCountry(){
	fetch(st_backend + "/countries")
	.then(response => response.json())
	.then(countriesJson => {
		let countryField = document.getElementById("st-country");
		for (var i = 0; i < countriesJson.data.length; i++) {
			var option = document.createElement("option");
			option.text = countriesJson.data[i].name;
			option.value = countriesJson.data[i].iso2;
			countryField.add(option);
		}
		countryField.addEventListener('change', () => {
			fetch(st_backend + "/states/" + countryField.value)
				.then(response => response.json())
				.then(countriesJson => {
					let stateField = document.getElementById("st-state");
					for (var i = stateField.options.length-1; i > 0; i--) {
						stateField.options[i] = null;
					}
					for (var i = 0; i < countriesJson.data.length; i++) {
						var option = document.createElement("option");
						option.text = countriesJson.data[i].name;
						option.value = countriesJson.data[i].state_code;
						stateField.add(option);
					}
				});
		});
	});
}
function setCookie(cname, cvalue, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	var expires = "expires="+d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}
function removeAllChildNodes(parent) {
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}
}
function hideElement(element){
	element.style.display="none";
}
function stToggleElement(selector){
	let element = document.querySelector(selector);
	if(element){
		if(element.style.display=="none"){
			element.style.display="";
		}else{
			element.style.display="none";
		}
	}
}
function stShowLoader(hideDelay=5000){
	document.getElementById("st-loader-mask").style.display = "";
	setTimeout(function(){stHideLoader();}, hideDelay);
}
function stHideLoader(){
	document.getElementById("st-loader-mask").style.display = "none";
}
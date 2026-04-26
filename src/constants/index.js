// ── NSE Equity Symbols ────────────────────────────────────────────────────────
// id: NSE ticker, yahoo: Yahoo Finance symbol (.NS), tv: TradingView symbol
// name: full company name  |  aliases: common search terms / brand names
export const SYMBOLS = [
  // ── NIFTY 50 — Large Caps ─────────────────────────────────────────────────
  { label: 'RELIANCE',    id: 'RELIANCE',    yahoo: 'RELIANCE.NS',    tv: 'NSE:RELIANCE',    sector: 'Energy',   name: 'Reliance Industries',            aliases: ['reliance', 'ril', 'jio', 'mukesh ambani'] },
  { label: 'TCS',         id: 'TCS',         yahoo: 'TCS.NS',         tv: 'NSE:TCS',         sector: 'IT',       name: 'Tata Consultancy Services',      aliases: ['tcs', 'tata consultancy', 'tata it'] },
  { label: 'INFY',        id: 'INFY',        yahoo: 'INFY.NS',        tv: 'NSE:INFY',        sector: 'IT',       name: 'Infosys',                        aliases: ['infosys', 'infy'] },
  { label: 'HDFCBANK',    id: 'HDFCBANK',    yahoo: 'HDFCBANK.NS',    tv: 'NSE:HDFCBANK',    sector: 'Banking',  name: 'HDFC Bank',                      aliases: ['hdfc bank', 'hdfc', 'housing development finance bank'] },
  { label: 'ICICIBANK',   id: 'ICICIBANK',   yahoo: 'ICICIBANK.NS',   tv: 'NSE:ICICIBANK',   sector: 'Banking',  name: 'ICICI Bank',                     aliases: ['icici bank', 'icici'] },
  { label: 'HINDUNILVR',  id: 'HINDUNILVR',  yahoo: 'HINDUNILVR.NS',  tv: 'NSE:HINDUNILVR',  sector: 'FMCG',     name: 'Hindustan Unilever',             aliases: ['hul', 'hindustan unilever', 'unilever', 'surf excel', 'lux', 'dove'] },
  { label: 'WIPRO',       id: 'WIPRO',       yahoo: 'WIPRO.NS',       tv: 'NSE:WIPRO',       sector: 'IT',       name: 'Wipro',                          aliases: ['wipro'] },
  { label: 'BAJFINANCE',  id: 'BAJFINANCE',  yahoo: 'BAJFINANCE.NS',  tv: 'NSE:BAJFINANCE',  sector: 'Finance',  name: 'Bajaj Finance',                  aliases: ['bajaj finance', 'bajfinance', 'bfl'] },
  { label: 'SBIN',        id: 'SBIN',        yahoo: 'SBIN.NS',        tv: 'NSE:SBIN',        sector: 'Banking',  name: 'State Bank of India',            aliases: ['sbi', 'state bank', 'state bank of india'] },
  { label: 'AXISBANK',    id: 'AXISBANK',    yahoo: 'AXISBANK.NS',    tv: 'NSE:AXISBANK',    sector: 'Banking',  name: 'Axis Bank',                      aliases: ['axis bank', 'axis'] },
  { label: 'LT',          id: 'LT',          yahoo: 'LT.NS',          tv: 'NSE:LT',          sector: 'Infra',    name: 'Larsen & Toubro',                aliases: ['l&t', 'larsen', 'larsen and toubro', 'larsen & toubro'] },
  { label: 'KOTAKBANK',   id: 'KOTAKBANK',   yahoo: 'KOTAKBANK.NS',   tv: 'NSE:KOTAKBANK',   sector: 'Banking',  name: 'Kotak Mahindra Bank',            aliases: ['kotak', 'kotak bank', 'kotak mahindra'] },
  { label: 'ITC',         id: 'ITC',         yahoo: 'ITC.NS',         tv: 'NSE:ITC',         sector: 'FMCG',     name: 'ITC Limited',                    aliases: ['itc', 'cigarette', 'wills', 'goldflake'] },
  { label: 'TITAN',       id: 'TITAN',       yahoo: 'TITAN.NS',       tv: 'NSE:TITAN',       sector: 'Consumer', name: 'Titan Company',                  aliases: ['titan', 'tanishq', 'fastrack', 'titan watches'] },
  { label: 'SUNPHARMA',   id: 'SUNPHARMA',   yahoo: 'SUNPHARMA.NS',   tv: 'NSE:SUNPHARMA',   sector: 'Pharma',   name: 'Sun Pharmaceutical',             aliases: ['sun pharma', 'sun pharmaceutical'] },
  { label: 'TATAMOTORS',  id: 'TATAMOTORS',  yahoo: 'TATAMOTORS.NS',  tv: 'NSE:TATAMOTORS',  sector: 'Auto',     name: 'Tata Motors',                    aliases: ['tata motors', 'tata', 'jlr', 'jaguar', 'land rover', 'nexon', 'punch'] },
  { label: 'TATASTEEL',   id: 'TATASTEEL',   yahoo: 'TATASTEEL.NS',   tv: 'NSE:TATASTEEL',   sector: 'Metal',    name: 'Tata Steel',                     aliases: ['tata steel', 'tata'] },
  { label: 'ADANIPORTS',  id: 'ADANIPORTS',  yahoo: 'ADANIPORTS.NS',  tv: 'NSE:ADANIPORTS',  sector: 'Infra',    name: 'Adani Ports & SEZ',              aliases: ['adani ports', 'adani'] },
  { label: 'POWERGRID',   id: 'POWERGRID',   yahoo: 'POWERGRID.NS',   tv: 'NSE:POWERGRID',   sector: 'Power',    name: 'Power Grid Corporation',         aliases: ['power grid', 'powergrid'] },
  { label: 'NTPC',        id: 'NTPC',        yahoo: 'NTPC.NS',        tv: 'NSE:NTPC',        sector: 'Power',    name: 'NTPC Limited',                   aliases: ['ntpc', 'national thermal power'] },
  { label: 'MARUTI',      id: 'MARUTI',      yahoo: 'MARUTI.NS',      tv: 'NSE:MARUTI',      sector: 'Auto',     name: 'Maruti Suzuki India',            aliases: ['maruti', 'suzuki', 'maruti suzuki', 'swift', 'brezza', 'alto'] },
  { label: 'BHARTIARTL',  id: 'BHARTIARTL',  yahoo: 'BHARTIARTL.NS',  tv: 'NSE:BHARTIARTL',  sector: 'Telecom',  name: 'Bharti Airtel',                  aliases: ['airtel', 'bharti', 'bharti airtel'] },
  { label: 'NESTLEIND',   id: 'NESTLEIND',   yahoo: 'NESTLEIND.NS',   tv: 'NSE:NESTLEIND',   sector: 'FMCG',     name: 'Nestle India',                   aliases: ['nestle', 'maggi', 'kitkat', 'munch'] },
  { label: 'DRREDDY',     id: 'DRREDDY',     yahoo: 'DRREDDY.NS',     tv: 'NSE:DRREDDY',     sector: 'Pharma',   name: "Dr Reddy's Laboratories",        aliases: ["dr reddy", "dr reddy's", 'drreddy'] },
  { label: 'CIPLA',       id: 'CIPLA',       yahoo: 'CIPLA.NS',       tv: 'NSE:CIPLA',       sector: 'Pharma',   name: 'Cipla',                          aliases: ['cipla'] },
  { label: 'HCLTECH',     id: 'HCLTECH',     yahoo: 'HCLTECH.NS',     tv: 'NSE:HCLTECH',     sector: 'IT',       name: 'HCL Technologies',               aliases: ['hcl', 'hcl tech', 'hcl technologies'] },
  { label: 'M&M',         id: 'M&M',         yahoo: 'M&M.NS',         tv: 'NSE:M_M',         sector: 'Auto',     name: 'Mahindra & Mahindra',            aliases: ['mahindra', 'm&m', 'scorpio', 'thar', 'xuv'] },
  { label: 'ONGC',        id: 'ONGC',        yahoo: 'ONGC.NS',        tv: 'NSE:ONGC',        sector: 'Energy',   name: 'Oil & Natural Gas Corporation',  aliases: ['ongc', 'oil gas', 'oil and natural gas'] },
  { label: 'COALINDIA',   id: 'COALINDIA',   yahoo: 'COALINDIA.NS',   tv: 'NSE:COALINDIA',   sector: 'Mining',   name: 'Coal India',                     aliases: ['coal india', 'coal'] },
  { label: 'JSWSTEEL',    id: 'JSWSTEEL',    yahoo: 'JSWSTEEL.NS',    tv: 'NSE:JSWSTEEL',    sector: 'Metal',    name: 'JSW Steel',                      aliases: ['jsw', 'jsw steel'] },

  // ── Nifty 50 / Nifty Next 50 additions ───────────────────────────────────
  { label: 'ASIANPAINT',  id: 'ASIANPAINT',  yahoo: 'ASIANPAINT.NS',  tv: 'NSE:ASIANPAINT',  sector: 'Consumer', name: 'Asian Paints',                   aliases: ['asian paints', 'asian'] },
  { label: 'BAJAJFINSV',  id: 'BAJAJFINSV',  yahoo: 'BAJAJFINSV.NS',  tv: 'NSE:BAJAJFINSV',  sector: 'Finance',  name: 'Bajaj Finserv',                  aliases: ['bajaj finserv', 'bajaj financial', 'bfsl'] },
  { label: 'BAJAJ-AUTO',  id: 'BAJAJ-AUTO',  yahoo: 'BAJAJ-AUTO.NS',  tv: 'NSE:BAJAJ_AUTO',  sector: 'Auto',     name: 'Bajaj Auto',                     aliases: ['bajaj auto', 'bajaj', 'pulsar', 'dominar', 'platina'] },
  { label: 'HEROMOTOCO',  id: 'HEROMOTOCO',  yahoo: 'HEROMOTOCO.NS',  tv: 'NSE:HEROMOTOCO',  sector: 'Auto',     name: 'Hero MotoCorp',                  aliases: ['hero', 'hero moto', 'hero motocorp', 'splendor', 'passion'] },
  { label: 'EICHERMOT',   id: 'EICHERMOT',   yahoo: 'EICHERMOT.NS',   tv: 'NSE:EICHERMOT',   sector: 'Auto',     name: 'Eicher Motors (Royal Enfield)',  aliases: ['royal enfield', 'eicher', 'bullet', 'classic 350', 'himalayan'] },
  { label: 'TECHM',       id: 'TECHM',       yahoo: 'TECHM.NS',       tv: 'NSE:TECHM',       sector: 'IT',       name: 'Tech Mahindra',                  aliases: ['tech mahindra', 'techm'] },
  { label: 'DIVISLAB',    id: 'DIVISLAB',    yahoo: 'DIVISLAB.NS',    tv: 'NSE:DIVISLAB',    sector: 'Pharma',   name: "Divi's Laboratories",            aliases: ["divi's", 'divis', 'divis lab'] },
  { label: 'ULTRACEMCO',  id: 'ULTRACEMCO',  yahoo: 'ULTRACEMCO.NS',  tv: 'NSE:ULTRACEMCO',  sector: 'Infra',    name: 'UltraTech Cement',               aliases: ['ultratech', 'ultratech cement', 'ultracem'] },
  { label: 'HINDALCO',    id: 'HINDALCO',    yahoo: 'HINDALCO.NS',    tv: 'NSE:HINDALCO',    sector: 'Metal',    name: 'Hindalco Industries',            aliases: ['hindalco', 'aluminium', 'aluminum'] },
  { label: 'VEDL',        id: 'VEDL',        yahoo: 'VEDL.NS',        tv: 'NSE:VEDL',        sector: 'Metal',    name: 'Vedanta',                        aliases: ['vedanta', 'vedl', 'vedanta resources'] },
  { label: 'BPCL',        id: 'BPCL',        yahoo: 'BPCL.NS',        tv: 'NSE:BPCL',        sector: 'Energy',   name: 'Bharat Petroleum',               aliases: ['bpcl', 'bharat petroleum', 'bharat petro'] },
  { label: 'TATACONSUM',  id: 'TATACONSUM',  yahoo: 'TATACONSUM.NS',  tv: 'NSE:TATACONSUM',  sector: 'FMCG',     name: 'Tata Consumer Products',         aliases: ['tata consumer', 'tata tea', 'tetley', 'tata salt'] },
  { label: 'TATAPOWER',   id: 'TATAPOWER',   yahoo: 'TATAPOWER.NS',   tv: 'NSE:TATAPOWER',   sector: 'Power',    name: 'Tata Power',                     aliases: ['tata power'] },
  { label: 'INDIGO',      id: 'INDIGO',      yahoo: 'INDIGO.NS',      tv: 'NSE:INDIGO',      sector: 'Consumer', name: 'IndiGo (InterGlobe Aviation)',   aliases: ['indigo', 'interglobe', 'airline', 'aviation'] },
  { label: 'DMART',       id: 'DMART',       yahoo: 'DMART.NS',       tv: 'NSE:DMART',       sector: 'Consumer', name: 'Avenue Supermarts (DMart)',      aliases: ['dmart', 'd-mart', 'avenue supermarts', 'supermart'] },
  { label: 'PIDILITIND',  id: 'PIDILITIND',  yahoo: 'PIDILITIND.NS',  tv: 'NSE:PIDILITIND',  sector: 'Consumer', name: 'Pidilite Industries',            aliases: ['pidilite', 'fevicol', 'fevikwik', 'dr fixit'] },
  { label: 'MARICO',      id: 'MARICO',      yahoo: 'MARICO.NS',      tv: 'NSE:MARICO',      sector: 'FMCG',     name: 'Marico',                         aliases: ['marico', 'parachute', 'saffola'] },
  { label: 'HAVELLS',     id: 'HAVELLS',     yahoo: 'HAVELLS.NS',     tv: 'NSE:HAVELLS',     sector: 'Consumer', name: 'Havells India',                  aliases: ['havells', 'lloyd'] },
  { label: 'TRENT',       id: 'TRENT',       yahoo: 'TRENT.NS',       tv: 'NSE:TRENT',       sector: 'Consumer', name: 'Trent (Westside / Zudio)',       aliases: ['trent', 'westside', 'zudio', 'star bazaar'] },

  // ── Banking & Finance ─────────────────────────────────────────────────────
  { label: 'INDUSINDBK',  id: 'INDUSINDBK',  yahoo: 'INDUSINDBK.NS',  tv: 'NSE:INDUSINDBK',  sector: 'Banking',  name: 'IndusInd Bank',                  aliases: ['indusind', 'indusind bank'] },
  { label: 'BANKBARODA',  id: 'BANKBARODA',  yahoo: 'BANKBARODA.NS',  tv: 'NSE:BANKBARODA',  sector: 'Banking',  name: 'Bank of Baroda',                 aliases: ['bank of baroda', 'bob', 'baroda'] },
  { label: 'PNB',         id: 'PNB',         yahoo: 'PNB.NS',         tv: 'NSE:PNB',         sector: 'Banking',  name: 'Punjab National Bank',           aliases: ['pnb', 'punjab national', 'punjab national bank'] },
  { label: 'CANBK',       id: 'CANBK',       yahoo: 'CANBK.NS',       tv: 'NSE:CANBK',       sector: 'Banking',  name: 'Canara Bank',                    aliases: ['canara bank', 'canara'] },
  { label: 'IDFCFIRSTB',  id: 'IDFCFIRSTB',  yahoo: 'IDFCFIRSTB.NS',  tv: 'NSE:IDFCFIRSTB',  sector: 'Banking',  name: 'IDFC First Bank',                aliases: ['idfc', 'idfc first', 'idfc first bank'] },
  { label: 'FEDERALBNK',  id: 'FEDERALBNK',  yahoo: 'FEDERALBNK.NS',  tv: 'NSE:FEDERALBNK',  sector: 'Banking',  name: 'Federal Bank',                   aliases: ['federal bank', 'federal'] },
  { label: 'HDFCLIFE',    id: 'HDFCLIFE',    yahoo: 'HDFCLIFE.NS',    tv: 'NSE:HDFCLIFE',    sector: 'Finance',  name: 'HDFC Life Insurance',            aliases: ['hdfc life', 'hdfc insurance'] },
  { label: 'SBILIFE',     id: 'SBILIFE',     yahoo: 'SBILIFE.NS',     tv: 'NSE:SBILIFE',     sector: 'Finance',  name: 'SBI Life Insurance',             aliases: ['sbi life', 'sbi insurance'] },
  { label: 'SBICARD',     id: 'SBICARD',     yahoo: 'SBICARD.NS',     tv: 'NSE:SBICARD',     sector: 'Finance',  name: 'SBI Cards and Payment Services', aliases: ['sbi card', 'sbi cards', 'sbi credit card'] },
  { label: 'MUTHOOTFIN',  id: 'MUTHOOTFIN',  yahoo: 'MUTHOOTFIN.NS',  tv: 'NSE:MUTHOOTFIN',  sector: 'Finance',  name: 'Muthoot Finance',                aliases: ['muthoot', 'muthoot finance', 'gold loan'] },
  { label: 'MANAPPURAM', id: 'MANAPPURAM',  yahoo: 'MANAPPURAM.NS',  tv: 'NSE:MANAPPURAM',  sector: 'Finance',  name: 'Manappuram Finance',             aliases: ['manappuram', 'manappuram finance', 'gold loan nbfc'] },
  { label: 'CHOLAFIN',   id: 'CHOLAFIN',    yahoo: 'CHOLAFIN.NS',    tv: 'NSE:CHOLAFIN',    sector: 'Finance',  name: 'Cholamandalam Investment',       aliases: ['chola', 'cholamandalam', 'chola finance'] },
  { label: 'ABCAPITAL',  id: 'ABCAPITAL',   yahoo: 'ABCAPITAL.NS',   tv: 'NSE:ABCAPITAL',   sector: 'Finance',  name: 'Aditya Birla Capital',           aliases: ['aditya birla capital', 'ab capital', 'birla'] },
  { label: 'YESBANK',    id: 'YESBANK',     yahoo: 'YESBANK.NS',     tv: 'NSE:YESBANK',     sector: 'Banking',  name: 'Yes Bank',                       aliases: ['yes bank', 'yesbank'] },
  { label: 'RBLBANK',    id: 'RBLBANK',     yahoo: 'RBLBANK.NS',     tv: 'NSE:RBLBANK',     sector: 'Banking',  name: 'RBL Bank',                       aliases: ['rbl bank', 'rbl', 'ratnakar bank'] },
  { label: 'BANDHANBNK', id: 'BANDHANBNK',  yahoo: 'BANDHANBNK.NS',  tv: 'NSE:BANDHANBNK',  sector: 'Banking',  name: 'Bandhan Bank',                   aliases: ['bandhan bank', 'bandhan'] },
  { label: 'KARURVYSYA', id: 'KARURVYSYA',  yahoo: 'KARURVYSYA.NS',  tv: 'NSE:KARURVYSYA',  sector: 'Banking',  name: 'Karur Vysya Bank',               aliases: ['karur vysya', 'karur bank', 'kvb', 'karur'] },
  { label: 'SOUTHBANK',  id: 'SOUTHBANK',   yahoo: 'SOUTHBANK.NS',   tv: 'NSE:SOUTHBANK',   sector: 'Banking',  name: 'South Indian Bank',              aliases: ['south indian bank', 'south bank', 'sib'] },
  { label: 'DCBBANK',    id: 'DCBBANK',     yahoo: 'DCBBANK.NS',     tv: 'NSE:DCBBANK',     sector: 'Banking',  name: 'DCB Bank',                       aliases: ['dcb bank', 'dcb', 'development credit bank'] },

  // ── Railways / PSU Mid-caps ───────────────────────────────────────────────
  { label: 'IRCTC',      id: 'IRCTC',       yahoo: 'IRCTC.NS',       tv: 'NSE:IRCTC',       sector: 'Consumer', name: 'Indian Railway Catering & Tourism', aliases: ['irctc', 'indian railway', 'rail catering'] },
  { label: 'IRFC',       id: 'IRFC',        yahoo: 'IRFC.NS',        tv: 'NSE:IRFC',        sector: 'Finance',  name: 'Indian Railway Finance Corp',      aliases: ['irfc', 'railway finance'] },
  { label: 'RVNL',       id: 'RVNL',        yahoo: 'RVNL.NS',        tv: 'NSE:RVNL',        sector: 'Infra',    name: 'Rail Vikas Nigam',                 aliases: ['rvnl', 'rail vikas', 'rail vikas nigam'] },
  { label: 'RECLTD',     id: 'RECLTD',      yahoo: 'RECLTD.NS',      tv: 'NSE:RECLTD',      sector: 'Finance',  name: 'REC Limited',                      aliases: ['rec', 'rec ltd', 'rural electrification'] },
  { label: 'PFC',        id: 'PFC',         yahoo: 'PFC.NS',         tv: 'NSE:PFC',         sector: 'Finance',  name: 'Power Finance Corporation',         aliases: ['pfc', 'power finance'] },
  { label: 'NHPC',       id: 'NHPC',        yahoo: 'NHPC.NS',        tv: 'NSE:NHPC',        sector: 'Power',    name: 'NHPC Limited',                      aliases: ['nhpc', 'hydro power'] },
  { label: 'NMDC',       id: 'NMDC',        yahoo: 'NMDC.NS',        tv: 'NSE:NMDC',        sector: 'Mining',   name: 'NMDC Limited',                      aliases: ['nmdc', 'national mineral', 'iron ore'] },
  { label: 'SAIL',       id: 'SAIL',        yahoo: 'SAIL.NS',        tv: 'NSE:SAIL',        sector: 'Metal',    name: 'Steel Authority of India',          aliases: ['sail', 'steel authority', 'steel authority of india'] },

  // ── Consumer / Food / Retail ─────────────────────────────────────────────
  { label: 'JUBLFOOD',   id: 'JUBLFOOD',    yahoo: 'JUBLFOOD.NS',    tv: 'NSE:JUBLFOOD',    sector: 'Consumer', name: "Jubilant FoodWorks (Domino's)",     aliases: ["dominos", "domino's", 'jubilant food', 'jublfood'] },
  { label: 'DEVYANI',    id: 'DEVYANI',     yahoo: 'DEVYANI.NS',     tv: 'NSE:DEVYANI',     sector: 'Consumer', name: 'Devyani International (KFC/Pizza Hut)', aliases: ['devyani', 'kfc', 'pizza hut', 'costa coffee'] },
  { label: 'NAUKRI',     id: 'NAUKRI',      yahoo: 'NAUKRI.NS',      tv: 'NSE:NAUKRI',      sector: 'IT',       name: 'Info Edge (Naukri.com)',            aliases: ['naukri', 'info edge', 'jeevansathi', '99acres'] },
  { label: 'POLICYBZR',  id: 'POLICYBZR',   yahoo: 'POLICYBZR.NS',   tv: 'NSE:POLICYBZR',   sector: 'Finance',  name: 'PB Fintech (Policybazaar)',         aliases: ['policybazaar', 'policybzr', 'pb fintech'] },

  // ── IT / Tech ─────────────────────────────────────────────────────────────
  { label: 'LTIM',        id: 'LTIM',        yahoo: 'LTIM.NS',        tv: 'NSE:LTIM',        sector: 'IT',       name: 'LTIMindtree',                    aliases: ['ltimindtree', 'mindtree', 'ltim', 'l&t infotech'] },
  { label: 'MPHASIS',     id: 'MPHASIS',     yahoo: 'MPHASIS.NS',     tv: 'NSE:MPHASIS',     sector: 'IT',       name: 'Mphasis',                        aliases: ['mphasis'] },
  { label: 'PERSISTENT',  id: 'PERSISTENT',  yahoo: 'PERSISTENT.NS',  tv: 'NSE:PERSISTENT',  sector: 'IT',       name: 'Persistent Systems',             aliases: ['persistent', 'persistent systems'] },
  { label: 'COFORGE',     id: 'COFORGE',     yahoo: 'COFORGE.NS',     tv: 'NSE:COFORGE',     sector: 'IT',       name: 'Coforge',                        aliases: ['coforge', 'niit tech'] },
  { label: 'ZOMATO',      id: 'ZOMATO',      yahoo: 'ZOMATO.NS',      tv: 'NSE:ZOMATO',      sector: 'Consumer', name: 'Zomato',                         aliases: ['zomato', 'food delivery'] },
  { label: 'PAYTM',       id: 'PAYTM',       yahoo: 'PAYTM.NS',       tv: 'NSE:PAYTM',       sector: 'Finance',  name: 'Paytm (One97 Communications)',   aliases: ['paytm', 'one97', 'one97 communications'] },
  { label: 'NYKAA',       id: 'NYKAA',       yahoo: 'NYKAA.NS',       tv: 'NSE:NYKAA',       sector: 'Consumer', name: 'Nykaa (FSN E-Commerce)',         aliases: ['nykaa', 'fsn', 'beauty'] },

  // ── Pharma & Healthcare ───────────────────────────────────────────────────
  { label: 'APOLLOHOSP',  id: 'APOLLOHOSP',  yahoo: 'APOLLOHOSP.NS',  tv: 'NSE:APOLLOHOSP',  sector: 'Pharma',   name: 'Apollo Hospitals',               aliases: ['apollo', 'apollo hospitals', 'apollo health'] },
  { label: 'MAXHEALTH',   id: 'MAXHEALTH',   yahoo: 'MAXHEALTH.NS',   tv: 'NSE:MAXHEALTH',   sector: 'Pharma',   name: 'Max Healthcare',                 aliases: ['max healthcare', 'max hospital'] },
  { label: 'TORNTPHARM',  id: 'TORNTPHARM',  yahoo: 'TORNTPHARM.NS',  tv: 'NSE:TORNTPHARM',  sector: 'Pharma',   name: 'Torrent Pharmaceuticals',        aliases: ['torrent pharma', 'torrent'] },
  { label: 'AUROPHARMA',  id: 'AUROPHARMA',  yahoo: 'AUROPHARMA.NS',  tv: 'NSE:AUROPHARMA',  sector: 'Pharma',   name: 'Aurobindo Pharma',               aliases: ['aurobindo', 'auro pharma'] },
  { label: 'LUPIN',       id: 'LUPIN',       yahoo: 'LUPIN.NS',       tv: 'NSE:LUPIN',       sector: 'Pharma',   name: 'Lupin',                          aliases: ['lupin'] },

  // ── Defence / PSU / Infra ─────────────────────────────────────────────────
  { label: 'BEL',         id: 'BEL',         yahoo: 'BEL.NS',         tv: 'NSE:BEL',         sector: 'Infra',    name: 'Bharat Electronics',             aliases: ['bel', 'bharat electronics', 'defence'] },
  { label: 'HAL',         id: 'HAL',         yahoo: 'HAL.NS',         tv: 'NSE:HAL',         sector: 'Infra',    name: 'Hindustan Aeronautics',          aliases: ['hal', 'hindustan aeronautics', 'aerospace'] },
  { label: 'ADANIENT',    id: 'ADANIENT',    yahoo: 'ADANIENT.NS',    tv: 'NSE:ADANIENT',    sector: 'Infra',    name: 'Adani Enterprises',              aliases: ['adani enterprises', 'adani'] },
  { label: 'ADANIGREEN',  id: 'ADANIGREEN',  yahoo: 'ADANIGREEN.NS',  tv: 'NSE:ADANIGREEN',  sector: 'Power',    name: 'Adani Green Energy',             aliases: ['adani green', 'adani renewable'] },
  { label: 'ABB',         id: 'ABB',         yahoo: 'ABB.NS',         tv: 'NSE:ABB',         sector: 'Infra',    name: 'ABB India',                      aliases: ['abb', 'abb india'] },
  { label: 'SIEMENS',     id: 'SIEMENS',     yahoo: 'SIEMENS.NS',     tv: 'NSE:SIEMENS',     sector: 'Infra',    name: 'Siemens India',                  aliases: ['siemens', 'siemens india'] },

  // ── Indices (for watchlist display only) ──────────────────────────────────
  { label: 'NIFTY 50',    id: '^NSEI',       yahoo: '^NSEI',          tv: 'NSE:NIFTY',       sector: 'Index',  name: 'Nifty 50 Index',       isIndex: true, aliases: ['nifty', 'nifty 50', 'nifty50'] },
  { label: 'BANK NIFTY',  id: '^NSEBANK',    yahoo: '^NSEBANK',       tv: 'NSE:BANKNIFTY',   sector: 'Index',  name: 'Bank Nifty Index',     isIndex: true, aliases: ['bank nifty', 'banknifty'] },
  { label: 'SENSEX',      id: '^BSESN',      yahoo: '^BSESN',         tv: 'BSE:SENSEX',      sector: 'Index',  name: 'BSE Sensex',           isIndex: true, aliases: ['sensex', 'bse', 'bse sensex'] },
];

// Symbols excluding indices (for main chart selection)
export const EQUITY_SYMBOLS = SYMBOLS.filter(s => !s.isIndex);

// ── Timeframes ────────────────────────────────────────────────────────────────
// id: our app ID, yahoo: Yahoo Finance interval, tv: TradingView resolution
export const TIMEFRAMES = [
  { label: '5m',  id: '5m',  yahoo: '5m',  tv: '5'   },
  { label: '15m', id: '15m', yahoo: '15m', tv: '15'  },
  { label: '30m', id: '30m', yahoo: '30m', tv: '30'  },
  { label: '45m', id: '45m', yahoo: '60m', tv: '45'  }, // YF has no 45m; uses 60m candles
  { label: '1h',  id: '1h',  yahoo: '60m', tv: '60'  },
  { label: '1D',  id: '1d',  yahoo: '1d',  tv: 'D'   },
  { label: '1W',  id: '1w',  yahoo: '1wk', tv: 'W'   },
  { label: '1M',  id: '1mo', yahoo: '1mo', tv: 'M'   },
];

// ── NSE Sectors for filtering ─────────────────────────────────────────────────
export const SECTORS = ['All', 'Banking', 'IT', 'Energy', 'FMCG', 'Pharma', 'Auto', 'Finance', 'Infra', 'Metal', 'Power', 'Telecom', 'Consumer', 'Mining'];

// ── Colors (same dark terminal palette as crypto-terminal) ────────────────────
export const COLORS = {
  bg:      '#0b0f1a',
  card:    '#101520',
  border:  '#1c2740',
  muted:   '#3a5270',
  text:    '#b8cce0',
  bright:  '#ddeeff',
  price:   '#3b82f6',
  ema9:    '#fbbf24',
  ema21:   '#f97316',
  ema50:   '#a78bfa',
  bb:      '#2a4060',
  rsi:     '#f97316',
  macd:    '#3b82f6',
  signal:  '#f85149',
  bull:    '#10d67a',
  bear:    '#f85149',
  neutral: '#d4a017',
  grid:    '#131e30',
  rupee:   '#fbbf24',  // Rupee symbol accent
};

export const REFRESH_INTERVAL = 60000; // 60 seconds (NSE data is less real-time via Yahoo Finance)
export const CANDLE_LIMIT = 250;

// ── NSE Market Hours (IST) ────────────────────────────────────────────────────
export const MARKET_OPEN_HOUR   = 9;
export const MARKET_OPEN_MIN    = 15;
export const MARKET_CLOSE_HOUR  = 15;
export const MARKET_CLOSE_MIN   = 30;

export function isMarketOpen() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day  = ist.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const h = ist.getHours();
  const m = ist.getMinutes();
  const mins = h * 60 + m;
  const open  = MARKET_OPEN_HOUR  * 60 + MARKET_OPEN_MIN;
  const close = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MIN;
  return mins >= open && mins < close;
}

export function marketStatus() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay();
  if (day === 0 || day === 6) return { open: false, label: 'Market Closed (Weekend)' };
  const h = ist.getHours();
  const m = ist.getMinutes();
  const mins = h * 60 + m;
  const open  = MARKET_OPEN_HOUR  * 60 + MARKET_OPEN_MIN;
  const close = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MIN;
  if (mins < open)  return { open: false, label: `Pre-Market (Opens ${MARKET_OPEN_HOUR}:${String(MARKET_OPEN_MIN).padStart(2,'0')} IST)` };
  if (mins >= close) return { open: false, label: 'Market Closed (15:30 IST)' };
  return { open: true, label: 'NSE Live' };
}

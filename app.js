/*
Modules
*/

var express = require('express')
var http = require('http')
var request = require('request')
var xml2js = require('xml2js');
var S = require('string');
var parser = new xml2js.Parser();
var eyes = require('eyes').inspector({maxLength: false});
var app = express();

/*
Configuration
*/
app.configure(function(){
	app.set('port', process.env.VMC_APP_PORT || 8888, null);
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/public'));
	app.enable('view cache');
});
/*
Root
*/
app.get("/", function(req, res){
	res.sendfile(__dirname + '/public/mashup.html');
});

/*
Hotel Service; two paremeters
*/
app.get("/hotels/:priceMin/:priceMax", function(req, res){
	var Min = req.params.priceMin;
	var Max = req.params.priceMax;
	var hotels = new Array();
	request("http://www.kayak.com/h/rss/hotelrss/SE/vaxjo?mc=EUR", function (error, response, data) {
	  if (!error && response.statusCode == 200) {
			data = S(data).replaceAll('k:', 'k_').s; // the parser doesnt allow to read fields with ':', then i replace ':' for '_' where i need	
			parser.parseString(data, function(err,result){
						  var size = result.rss.channel[0].item.length;
						  for (i=0; i < size; i++) {
								var hotel = result.rss.channel[0].item;
								var hotelPrice = parseInt(result.rss.channel[0].item[i].kyk_price);
								if ( hotelPrice >= Min && hotelPrice <= Max){
								   var hotelJson = {
									    name: result.rss.channel[0].item[i].kyk_hotelname,
										price: result.rss.channel[0].item[i].kyk_price,
										externalLink: result.rss.channel[0].item[i].link,
										stars: result.rss.channel[0].item[i].kyk_stars
									}
									//deleting some characters
									hotelJson['name']= S(hotelJson['name']).replaceAll("[ '", '').s;
									hotelJson['name']= S(hotelJson['name']).replaceAll("' ]", '').s;
									hotelJson['price']= S(hotelJson['price']).replaceAll("[ '", '').s;
									hotelJson['price']= S(hotelJson['price']).replaceAll("' ]", '').s;
									hotelJson['externalLink']= S(hotelJson['externalLink']).replaceAll("[ '", '').s;
									hotelJson['externalLink']= S(hotelJson['externalLink']).replaceAll("' ]", '').s;
									hotelJson['stars']= S(hotelJson['stars']).replaceAll("[ '", '').s;
									hotelJson['stars']= S(hotelJson['stars']).replaceAll("' ]", '').s;
									hotels.push(hotelJson); 
								}
						  }
						res.send(JSON.stringify(hotels));
			});
  		};
 	 });
});

/*
CompareWeather service, receives 4 parameters
*/
app.get("/CompareWeather/:day/:month/:year/:town", function(req, res){
		var day=req.params.day;
		var month=req.params.month - 1;
		var year=req.params.year;
		var town=req.params.town;
		var fixedTown = 'V%C3%A4xj%C3%B6';
		var urlRequest= "http://api.wolframalpha.com/v2/query?input=weather%20"+ town +"%20"+ month+'%20' + day+'%20' + year+"&appid=JGU8UU-J2Y77HVAEX";
				var entry = {};
				request(urlRequest, function (error, response, data) {
				  console.log("Requesting variable to " + urlRequest);
				  if (!error && response.statusCode == 200) {	
						parser.parseString(data, function(err,result){
							var pods = result.queryresult.pod;
				//			console.log(result.queryresult);
					//		eyes(result.queryresult);
							for (i=0; i < pods.length; i++) {
								if (pods[i].$.id == 'WeatherSummary:WeatherData'){
									var text =  pods[i].subpod[0].plaintext;
									entry['townText']= S(text).replaceAll('|', ':').s;
									entry['townText']= S(entry['townText']).replaceAll('\n', '<br>').s;									
								}
						  }
						  urlRequest2= "http://api.wolframalpha.com/v2/query?input=weather%20"+ fixedTown +"%20"+ month+'%20' + day+'%20' + year+"&appid=JGU8UU-J2Y77HVAEX";
							request(urlRequest2, function (error, response, data) {
							 		parser.parseString(data, function(err,result){
										var pods = result.queryresult.pod;
										for (i=0; i < pods.length; i++) {
											if (pods[i].$.id == 'WeatherSummary:WeatherData'){
												var text =  pods[i].subpod[0].plaintext;
												entry['vxuText']= S(text).replaceAll('|', ':').s;
												entry['vxuText']= S(entry['vxuText']).replaceAll('\n', '<br>').s;
											}
									  }
									 
									 res.send(JSON.stringify(entry));
									
									});
							 
							});
						});
				 
				  }
				});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Listening on port ' + app.get('port'));
});
// This is a template for a Node.js scraper on morph.io (https://morph.io)

var cheerio = require("cheerio");
var request = require("request");
var sqlite3 = require("sqlite3").verbose();

function initDatabase(callback) {
	// Set up sqlite database.
	var db = new sqlite3.Database("data.sqlite");
	db.serialize(function() {
		db.run("DROP TABLE IF EXISTS habinedita");
		db.run("CREATE TABLE IF NOT EXISTS habinedita (valor TEXT,url TEXT,date INT)");
		callback(db);
	});
}

function updateRow(db, valor, url) {
	// Insert some data.
	var datetime = new Date();
	var statement = db.prepare("INSERT INTO habinedita VALUES (?,?,?)");
	statement.run(valor,url,datetime);
	statement.finalize();
}

function readRows(db) {
	// Read some data.
	db.each("SELECT rowid AS id, valor, url, datetime(date, 'unixepoch') AS data FROM habinedita", function(err, row) {
		console.log(row.id + ": " + row.valor + ": " + row.url + ": " + row.data);
	});
}

function fetchPage(url, callback) {
	// Use request to read in pages.
	request(url, function (error, response, body) {
		if (error) {
			console.log("Error requesting page: " + error);
			return;
		}

		callback(body);
	});
}

function run(db) {
	// Use request to read in pages.
	var page=1
	
	
	do{
		var items = 0;
		var next = "/imoveis/?pg=4&o=1&g=1&dd=13&cc=12&nq=2-4&p=-250000&ct=0000000000001&or=10"
		fetchPage("https://www.habinedita.com"+next, setTimeout(function (body) {
			// Use cheerio to find things in the page with css selectors.
			var $ = cheerio.load(body);
			next = $('a.paginacao-nav').attr('href');
			console.log("next :"+next);
			var elements = $(".lbl_preco").each(function () {
				var nome = $(this).text().trim();
				var url = $(this).parent().attr('href');
				items++;
				console.log(items);
				updateRow(db, nome, url);
			}),1000);
			readRows(db);
			db.close();
		});
		page++;
		console.log("in page "+page);
	}while(next != undefined);
	console.log("out page "+page);
	console.log("out items "+items);
}

initDatabase(run);

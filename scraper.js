// This is a template for a Node.js scraper on morph.io (https://morph.io)

var cheerio = require("cheerio");
var request = require("request");
var sqlite3 = require("sqlite3").verbose();

function initDatabase(callback) {
	// Set up sqlite database.
	var db = new sqlite3.Database("data.sqlite");
	db.serialize(function() {
		db.run("DROP TABLE IF EXISTS habinedita");
		db.run("CREATE TABLE IF NOT EXISTS habinedita (valor TEXT,url TEXT,date TEXT)");
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
	db.each("SELECT rowid AS id, valor, url, datetime(date, 'unixepoch') FROM habinedita", function(err, row) {
		console.log(row.id + ": " + row.valor + ": " + row.url + ": " + row.date);
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
	fetchPage("https://www.habinedita.com/imoveis/?pg=1&o=1&g=1&dd=13&cc=12&nq=2-2&p=100000-225000&dioma=pt", function (body) {
		// Use cheerio to find things in the page with css selectors.
		var $ = cheerio.load(body);

		var elements = $(".lbl_preco").each(function () {
			var nome = $(this).text().trim();
			var url = $(this).parent().attr('href');

			updateRow(db, nome, url);
		});

		readRows(db);

		db.close();
	});
}

initDatabase(run);

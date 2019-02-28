let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let bodyParser = require("body-parser");
var cors = require('cors');
let USERS = [];
var pengguna
var MongoClient = require('mongodb').MongoClient;
//var url = "mongodb://localhost:27017";
var url = 'mongodb://saya:saya04@ds153394.mlab.com:53394/dokumen';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({origin: '*'}))
app.use(function(req, res, next) {
  console.log('Headers Middleware Called');

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'https://serverdocument.herokuapp.com');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'origin, x-requested-with, content-type, accept, x-xsrf-token', 'token');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Request headers you wish to expose
  res.setHeader('Access-Control-Expose-Headers', false);

  next();
});

//http.listen(2000, () => {  console.log('started on port 2000'); });

http.listen(process.env.PORT);console.log('started on port 2000');

MongoClient.connect('mongodb://saya:saya04@ds153394.mlab.com:53394/dokumen',{useNewUrlParser:true}, function(err,db){
	if(err){
		console.log(err);
	}else{
		console.log('Connected to mongodb!');
	}
});

//io.set('transport',['websocket']);
io.on('connection', (socket) => {

console.log("Ready")
function showTime(){
    var date = new Date();
    var h = date.getHours()+7; // 0 - 23
    var m = date.getMinutes(); // 0 - 59  var
    var s = date.getSeconds(); // 0 - 59
    var ms = date.getMilliseconds() 
    
    h = (h > 23 ) ? h-24 : h;
    h = (h < 10) ? "0" + h : h;
    m = (m < 10) ? "0" + m : m;
    s = (s < 10) ? "0" + s : s;
    ms = (ms < 10) ? "00" + ms :ms;
    ms = (ms < 100) ? "0" +ms : ms;
    
    
    var time1 = h + ":" + m + ":" + s+ ":" + ms;
    var time2 = h + ":" + m + ":" + s;
    io.sockets.emit('timer',{time1,time2})
    setTimeout(showTime, 1000);   
}
showTime();


//Fungsi untuk registrasi
  socket.on('registration',(data,callback)=>{
  	console.log(data)
  	try{
	  	MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			var dbo = db.db('dokumen');
			if(err) throw err;
			var query = {username:data.username};
			var myobj = {username:data.username,password:data.password1}
			dbo.collection("pengguna").find(query, { username: 1, password: 0 }).toArray(function(err, result) {

				if(result==''){
					dbo.collection('pengguna').insertOne(myobj,function(err,res){
						if(err){
							throw err;
							callback(false);
							console.log("Gagal 1")

						}else {
							callback(true);
							updateUser();
							console.log("Berhasil buat user");
						}
					});

				}else {
					console.log('Gagal 2')
					callback(false);
				}
				db.close();
			});
		})
	 }catch(err){
	 	callback(false);
	 }

  });

//fungsi untuk login
  socket.on('login',(data,callback)=>{
	if(data.username in USERS){
  		let result={err:1,res:false}
  		callback(result);
  	
  	}else{
  		try{
	  		MongoClient.connect(url,{useNewUrlParser:true},(err,db)=>{
	  			var dbo = db.db('dokumen');
	  			if(err) console.log(err);
	  			var query = {username:data.username,password:data.password}
	  			dbo.collection('pengguna').find(query,{username:1,password:1}).toArray(function(err,result){
	  				
	  				if (result=='') {
	  					let result={err:2,res:false}
  						callback(result);

	  				}else{
	  					let result={err:0,res:true}
  						newUser(data.username)
  						callback(result);
	  				}
	  				db.close();
	  			});
	  		});
	  	}
	  	catch(err){
	  		let result={err:3,res:false}
  			callback(result);
	  	}
  	}

  });

//fungsi untuk logout
socket.on('logout',data=>{
	console.log(socket.nickname + ' Disconnect ');
	delete USERS[socket.nickname];
	updateUser();
})


//Fungsi untuk menambahkan pengguna baru pada array Users
  function newUser(data){
  	socket.nickname = data;
  	USERS[socket.nickname] = socket;
  	console.log(socket.nickname +' joined');
  	updateUser();
  }

  //apabila ada perubahan user maka list akan diupdate
	function updateUser(){
		pengguna = Object.keys(USERS);
		io.sockets.emit('newUser',pengguna);
		console.log(pengguna);
	}


//fungsi mengambil daftar pengguna yang terdaftar dan pengguna yang sedang online
	socket.on('getAllUser',function(data,callback){
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			var dbo = db.db('dokumen');
			if(err) throw err;
			dbo.collection('pengguna').find().toArray(function(err,result){
				let res={online:pengguna,user:result}
				callback(res)
				db.close();
			})
		});
	});


  
  //fungsi untuk mengirim pesan
  socket.on('pSendMessage', (message,callback) => {
	var d = new Date();
	var weekday = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

	var hari = weekday[d.getDay()];
	var tahun = d.getFullYear(); 
	var bulan= d.getMonth()+1;
	var tanggal = d.getDate();
	var jam = d.getHours()+7;
	var menit = d.getMinutes();
	var detik = d.getSeconds();								
	var waktu = hari + ' ' + tanggal + '-' + bulan + '-' + tahun + ' ' + jam + ':' + menit + ':' + detik;
	console.log(tanggal)
	var data={text:message.text, to:message.to, from:message.from, created:waktu}
	MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
		var dbo = db.db('dokumen');
		if(err) throw err;
		dbo.collection('pesan').insertOne(data,function(err,res){
			if(err){
				console.log(err)
			}else {
				if(message.to in USERS){
					callback(data)
					USERS[message.to].emit('pUpdateMessage',{text:message.text, to:message.to, from:message.from, created:waktu});
					console.log('1')
				}else{
					callback(data)
					console.log('2')
				}
				console.log('Pesan berhasil')
			}
			db.close()
		})
	});
	
  });



  //fungsi untuk mengambil riwayat pesan
  socket.on('pGetMessage',(data,callback)=>{
  	to = data.to;
	from = data.from;
	MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
		var dbo = db.db('dokumen');
		if(err) throw err;
		var date = { created : -1 }
		const query = {$or: [ {$and: [{"to": to}, {"from": from}]}, {$and: [{"from": to}, {"to": from}]} ] };
		dbo.collection("pesan").find(query, {}).sort(date).limit(10).toArray(function(err, result) {
			callback(result);
			db.close();
		});
	});
  })


//fungsi untuk mengambil list dokumen
	socket.on('getListDocument',(data,callback)=>{
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			var dbo = db.db('dokumen')
			dbo.collection('dokumen').find({},{title:1}).toArray(function(err,result){
				callback(result)
				db.close();
			});
		});
	});


//fungsi untuk melaukukan verifikasi dokumen
	socket.on('verification',function(data,callback){
		var loginUser = data.loginUser;
		var title = data.title;
		var password = data.password;
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			if (err) throw err;
			var dbo = db.db('dokumen');
			var myquery = {title:title,password:password};
			dbo.collection('dokumen').find(myquery,{title:1,password:1,date:1,desc:1,owner:1,text:1}).toArray(function(err,result){
				if(result[0]===undefined){
					callback(false)
				}else{
					callback(true);
					joinDokumen(title,loginUser);
				}
				db.close();
			});
		});
	});


//fungsi join dokumen
function joinDokumen(title,loginUser){
	socket.nickname = loginUser;
	socket.room = title;
	USERS[socket.nickname] = socket;
	socket.join(socket.room);	
}

//fungsi getTextDocument
	socket.on('getTextDocument',(data,callback)=>{
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			if (err) throw err;
			var dbo = db.db('dokumen');
			var myquery = {title:data};
			dbo.collection('dokumen').find(myquery,{title:1,password:1,date:1,desc:1,owner:1,text:1}).toArray(function(err,result){
				if(result[0]===undefined){
					
				}else{
					callback(result);
				}
				db.close();
			});
		});
	})



//fungsi untuk membuat Dokumen
	socket.on('createDocument',(dokumen,callback)=>{
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			var dbo = db.db('dokumen');

			var d = new Date();
			var weekday = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

			var hari = weekday[d.getDay()];
			var tahun = d.getFullYear(); 
			var bulan= d.getMonth()+1;
			var tanggal = d.getDate();
			var jam = d.getHours()+7;
			var menit = d.getMinutes();
			var detik = d.getSeconds();								
			var waktu = hari + ' ' + tanggal + '-' + bulan + '-' + tahun + ' ' + jam + ':' + menit + ':' + detik;

			jam = (jam > 17 ) ? jam-24 : jam;
			jam = (jam < 10) ? "0" + jam : jam;
			menit = (menit < 10) ? "0" + menit : menit;
			detik = (detik < 10) ? "0" + detik : detik;

			var query = {title:dokumen.title};
			dbo.collection('dokumen').find(query,{title:1,password:1,date:1,desc:1,owner:1,text:0}).toArray(function(err,result){
				
				if(result==''){
					var myobj = {title:dokumen.title,
								password:dokumen.password,
								date:waktu,
								desc:dokumen.description,
								owner:dokumen.owner,
								text:dokumen.text};
					dbo.collection('dokumen').insertOne(myobj,function(err,res){
						if(err){
							throw err;
							callback(false);
						}	
						else{
							console.log('1 document inserted');
							callback(true);
							var owner = dokumen.owner;
							getDokumen();
						}
					});
					

				}else {
					callback(false);
				}
			db.close();
			});
		});
	});


//fungsi untuk mengupdate daftar dokumen di home
	function getDokumen(){
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			var dbo = db.db('dokumen');
			dbo.collection('dokumen').find().toArray(function(err,result){
				db.close();
				io.sockets.emit('updateListDocument',{data:result});
			});
			
		});
	}


//fungsi get dokumen di mydokumen dari database
	socket.on('getListMyDocument',function(data,callback){
		getMydokumen(data.owner,callback);
	});


//fungsi untuk mengupdate daftar dokumen di mydokumen
	function getMydokumen(data,callback){
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			query = {owner:data};
			var dbo = db.db('dokumen');
			dbo.collection('dokumen').find(query,{title:1,password:1,date:1,desc:1,owner:1,text:0}).toArray(function(err,result){
				db.close();
				callback(result);
			});
		});
	}

//fungsi untuk mendelete dokumen
	socket.on('deleteDocument',function(data,callback){
		MongoClient.connect(url,{useNewUrlParser:true}, function(err, db) {
			if (err) console.log(err);
			var dbo = db.db("dokumen");
			var myquery = {title:data.title,password:data.password};
			dbo.collection("dokumen").deleteOne(myquery, function(err, result) {  
				if(result.deletedCount==0){
					console.log('Delete Failed')
					callback(false)
				}else {
					getMydokumen(data.owner,callback);
					getDokumen();
				}
				db.close();
			});
		});
		
	});


//fungsi send pesan document
	socket.on('dSendMessage',function(data,callback){
		var d = new Date();
		var weekday = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

		var hari = weekday[d.getDay()];
		var tahun = d.getFullYear(); 
		var bulan= d.getMonth()+1;
		var tanggal = d.getDate();
		var jam = d.getHours()+7;
		var menit = d.getMinutes();
		var detik = d.getSeconds();								
		var waktu = hari + ' ' + tanggal + '-' + bulan + '-' + tahun + ' ' + jam + ':' + menit + ':' + detik;

		jam = (jam > 17 ) ? jam-24 : jam;
		jam = (jam < 10) ? "0" + jam : jam;
		menit = (menit < 10) ? "0" + menit : menit;
		detik = (detik < 10) ? "0" + detik : detik;

		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			var dbo = db.db('dokumen');
			if(err) throw err;

			const myobj = { text:data.text,
							document:data.to,
							from:data.from,
							created:waktu};
			dbo.collection('pesandokumen').insertOne(myobj,function(err,result){
				if(err) throw err;
				else {
					callback({text:data.text,from:data.from,created:waktu})
					socket.broadcast.to(data.to).emit('dUpdateMessage',{text:data.text,from:data.from,created:waktu})
				}
			});
			
			db.close();
		});
	});


//fungsi untuk mengambil histori chat dokumen
	socket.on('dGetMessage',function(data,callback){
		var myquery = {document:data};
		var date = { created : -1 }
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			var dbo = db.db('dokumen');
			if(err) throw err;
			dbo.collection('pesandokumen').find(myquery,{}).sort(date).limit(10).toArray(function(err,result){

				callback(result);
			});
			db.close();
		});
	});

//fungsi leave dokumen
	socket.on('leaveDocument',function(data){
		socket.leave(socket.room);
	});


//fungsi untuk mengupdate data text dokumen
	socket.on('sendTextDocument',function(data){
		var myquery = { title: data.title };
  		var newvalues = { $set: {text: data.data} };
  		console.log(data)
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			if (err) throw err;
			
			var dbo = db.db('dokumen');
			dbo.collection('dokumen').find(myquery,{}).toArray(function(err,result){
				

				if(result[0].text!=data.data){
					dbo.collection('dokumen').updateOne(myquery,newvalues,function(err,res){
						if (err) throw err;
						
						sendLog(data)
						socket.broadcast.to(data.title).emit('updateTextDocument',data);
						db.close();
					});
				}
			});
		});		
	});


//fungsi untuk diskonek
  socket.on('disconnect',()=>{
	if(!socket.nickname) return;
	console.log(socket.nickname + ' Disconnect ');
	delete USERS[socket.nickname];
	socket.leave(socket.room);
	updateUser();
  });


//fungsi update log
	function sendLog(data){
		console.log('Data ; '+ data.sender)
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			if (err) console.log(err);

			var dbo = db.db('dokumen');

					var d = new Date();
					var weekday = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

					var hari = weekday[d.getDay()];
					var tahun = d.getFullYear(); 
					var bulan= d.getMonth()+1;
					var tanggal = d.getDate();
					var jam = d.getHours()+7;
					var menit = d.getMinutes();
					var detik = d.getSeconds();

					jam = (jam > 23 ) ? jam-24 : jam;
					jam = (jam < 10) ? "0" + jam : jam;
					menit = (menit < 10) ? "0" + menit : menit;
					detik = (detik < 10) ? "0" + detik : detik;

					var waktu = hari + ' ' + tanggal + '-' + bulan + '-' + tahun + ' ' + jam + ':' + menit + ':' + detik;

					var myobj = {
						document : data.title,
						create : waktu,
						editor : data.sender
					}

						dbo.collection('log').insertOne(myobj,function(err,result){
							if(err) console.log(err)
							else {
								console.log('1 document inserted');
								socket.broadcast.to(data.title).emit('updateLog',{oke:''});
							}
						})
			});
	}


//fungsi get Log
	socket.on('getLog',function(data,callback){
		var date = { create : -1 }
		var query = { document:data }
		console.log(query);
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			if(err) console.log(err)
			var dbo = db.db('dokumen');
			dbo.collection('log').find(query,{}).sort(date).limit(15).toArray(function(err,result){
				callback(result);
			});
		})
	})
});
/**
 * @author Ken Murray
 * @version 1.0

 *  cd /data/www/mstreams.webcamclub.com/current/nodeapps
 *	node --expose-gc --max-old-space-size=2048 am_chat.js
 */

var express = require('express'), 
fs = require('fs'),
app = express(), 
http = require('http'), 
server = http.createServer(app),
path = require('path'),
os = require('os'),
io = require('socket.io').listen(server),
child_process = require("child_process"),
spawn = require('child_process').spawn;

/*
winston = require('winston'),
logger = winston.createLogger({
    timestamp: true,
    format: winston.format.json(),
    transports: [
        new winston.transports.File({filename: chef.log_path + '/error-freechat.log', level: 'error'}),
        new winston.transports.File({filename: chef.log_path + '/app-freechat.log', level: 'info'})
    ]
});
*/

var oldCPUTime     = 0, 
oldCPUIdle         = 0, 
server_cpu         = 0,
server_mem         = 0,
server_rss         = 0,
server_heapTotal   = 0,
server_heapUsed    = 0,

serverPort         = 8002,
frameRate          = "4",
audiocount         = 0,
count              = 0,
zeroPadDef         = 100000,
zeroPadCnt         = 0,
zeroPadAudioCnt    = 0,

PATH               = "/data/www/snaps/",
applicationData    = null,
data_len           = null,
usernames          = {},
rooms              = [],
found              = false,
img,data,buf,imgdata,audiobuf,audioBlob,audiodata,cpus,totalTime,totalIdle,cpu,CPUload,vhost,evt,ops,ops3,len,lenres,arrlen,my_str,my_array;

userList = new Array();

require("./includes/am.livechat.js");
amchat = new amLiveChat();
amchat.app = 'amchat';
amchat.version = '1.0.0.1';

app.use(express.static('static'));

/* HLS CORS headers */
app.all('*', function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "X-Requested-With");
   res.header('Access-Control-Allow-Headers', 'Content-Type');
   next();
});

/* HLS manifest parser */
app.get('/video.m3u8', function (req, res) {
	try {
		if ( req != null && req !== "" && req.query != null && req.query !== "" && req.query.showtype != null && req.query.showtype !== "" && req.query.modelName != null && req.query.modelName !== "" ) {
			if ( fs.existsSync( PATH + req.query.showtype + '/' + req.query.modelName + '/video.m3u8' ) ) {
				res.sendFile( PATH + req.query.showtype + '/' + req.query.modelName + '/video.m3u8');
			}
			else {
				amchat.trace ("app.get m3u8 NOT found");
			}
		}
		else {
			amchat.trace ("app.get m3u8 request param WAS null");
		}
	}
	catch ( e ) { 
		amchat.trace ("app.get m3u8 catch e = " + e );
	}
});

/* HLS segments parsers */
app.get('/video*.ts', function (req, res) {
	try {
		if ( req.originalUrl.indexOf(".ts?") != -1 ) {

			my_str = req.originalUrl;
        	my_array = my_str.split( ".ts?" );
			
			//amchat.trace ("current segment = " + my_array[0] );
			
			if ( req != null && req !== "" && req.query != null && req.query !== "" && req.query.showtype != null && req.query.showtype !== "" && req.query.modelName != null && req.query.modelName !== "" ) {
				if ( fs.existsSync( PATH + req.query.showtype + '/' + req.query.modelName + my_array[0] + '.ts?showtype=fs&modelName=' + req.query.modelName ) ) {
					res.sendFile( PATH + req.query.showtype + '/' + req.query.modelName + my_array[0] + '.ts?showtype=fs&modelName=' + req.query.modelName );
				}
				else {
					amchat.trace ("app.get "+my_array[0]+" NOT found");
				}
			}
			else {
				amchat.trace ("app.get "+my_array[0]+" request param WAS null");
			}
		}
	}
	catch ( e ) { 
		amchat.trace ("app.get ts catch e = " + e );
	}
});

var RawDeflate = require('./rawinflate');
app.use('/rawinflate', amchat.callback);

io.sockets.on('connection', function onConnect(socket) {
	socket.emit('message','server connected!');

	socket.on('adduser', function onAddUser(client) {
		try {
			//amchat.trace( "adduser FIRED client.username = " + client.username );
			if ( client.username == null || client.username == "" || client.username == "undefined" ) {
                socket.disconnect(true);
                return;
            }
			
			socket.username = client.username;
			amchat.trace("socket.username = " + client.username);
			
            socket.userID = client.userID;
            amchat.trace("socket.userID = " + client.userID);

            socket.sessionName = client.sessionName;
			amchat.trace("socket.sessionName = " + client.sessionName);
			
            socket.session_id = client.session_id;
			amchat.trace("socket.session_id = " + client.session_id);
			
            socket.gateway = client.gateway;
			amchat.trace("socket.gateway = " + client.gateway);
			
            socket.room = client.room;
			amchat.trace("socket.room = " + socket.room);
            
            socket.usertype = client.usertype;
			amchat.trace("socket.usertype = " + client.usertype);
			
            socket.type = client.usertype;
			amchat.trace("socket.type = " + socket.type );

			socket.count = 0;
			socket.audiocount = 0;

			if ( client.volume != null && client.volume != "" && client.volume != "undefined" ) {
				socket.volume = client.volume;
			}
			else {
				socket.volume = '0.5';
			}

			amchat.trace("socket.volume = " + socket.volume );
			
			socket.recording = false;
			//amchat.trace("socket.recording = " + socket.recording );
			
			if ( client.useOgg != null && client.useOgg != "" ) {
				socket.useOgg = client.useOgg;
			}
			else {
				socket.useOgg = false;
			}

			amchat.trace("socket.useOgg = " + socket.useOgg );

			if ( client.frameRate != null && client.frameRate != "" ) {
				socket.frameRate = client.frameRate;
			}
			else {
				socket.frameRate = "4";
			}
			amchat.trace("socket.frameRate = " + socket.frameRate );
			
			if ( client.renderHLS != null && client.renderHLS != "" ) {
				socket.renderHLS = client.renderHLS;
			}
			else {
				socket.renderHLS = false;
			}
			amchat.trace("socket.renderHLS = " + socket.renderHLS );
			
			found = false;
			// Determine if the room exists.
			for ( var i in rooms ) {
				if ( rooms[i] == client.room ) {
					found = true;
				}
			}
			i = null;
			
			// If not found add it to room list;
			if ( !found ) {
				rooms.push( client.room );
			}
			
			if ( client.username != null ) {
				userList.push( client.username );
						
				userList[ client.username ] = {};
				userList[ client.username ] = client;
			
				userList[ client.username ].session_id = socket.session_id;
				userList[ client.username ].username = socket.username;
				userList[ client.username ].roomID = socket.id;
	
				userList[ client.username ].socket = socket;
				userList[ client.username ]['clients'] = [];
				userList[ client.username ]['clients'].push( socket );
				
				amchat.trace("userList[ client.username ].roomID = " + userList[ client.username ].roomID);
	
				// check if a temp dir exists if not, create one.
				amchat.mkdirSync( fs, PATH + 'fs/' + socket.room, socket.useOgg );
				
				socket.join(client.room);
				socket.emit('onadduser','adding user: ' + client.username + " room: " + client.room );
				
				
				amchat.member_connect( client, io );
			}
		}
		catch ( e ) {
			amchat.trace( "adduser catch e = " + e );
		}
	});
	
	socket.on('msgFromClient', function onMsgFromClient(msg) {
        try {
			//amchat.trace("msgFromClient user socket.username " + socket.username );
			io.sockets.in(socket.room).emit('msgFromServer', socket.username , msg );
        }
        catch (e) {
            amchat.trace("msgFromClient catch e = " + e, 'error');
        }
    });

	socket.on('whisperTo', function onWhisperTo(username, msg) {
        try {
			if ( userList[username] != null && userList[username].socket ) {
				amchat.trace("whisperTo user socket.username " + socket.username );
           	 	userList[username].socket.emit('setHistory', username, msg);
			}
			else {
				amchat.trace("whisperTo user socket WAS null");
			}
        }
        catch (e) {
            amchat.trace("whisperTo catch e = " + e, 'error');
        }
    });
	
	socket.on('kickTo', function onKickTo(username, err) {
        try {
			if ( userList[username] != null && userList[username].socket ) {
				if ( userList[username].member_info.member_info.is_moderator ) {
					socket.emit('on_kick_remove_mod', username + " is_moderator");
					return;
				}

				io.sockets.in(socket.room).emit( 'RemoveUser', username );
				
				userList[username].socket.emit('do_kicked_msg');
				userList[username].socket.disconnect(true);
				
				socket.emit('on_kick_remove_user', username );
			}
			else {
				amchat.trace("kickTo user socket WAS null");
				socket.emit('on_kick_remove_user', null );
			}
        }
        catch (e) {
            amchat.trace("kickTo catch e = " + e, 'error');
        }
    });
	
	socket.on('banTo', function onBanTo(user, reasonToBan, permanent, err) { 
        try {
            //amchat.BanUser(userList[socket.room]['clients'][j], reasonToBan, permanent);
			if ( userList[username] != null && userList[username].socket ) {
				io.sockets.in(socket.room).emit( 'RemoveUser', username );
				
				userList[username].socket.emit('do_banned_msg');
				userList[username].socket.disconnect(true);
			}
			else {
				amchat.trace("banTo user socket WAS null");
			}
        }
        catch (e) {
            amchat.trace("banTo catch e = " + e, 'error');
        }
    });
	
	socket.on('GetUserList', function onGetUserList( roomIndex ) {
        try {
			amchat.trace("GetUserList userList.length " + userList.length );
			for ( var i in userList ) {
				if ( userList[i].socket != null ) {
					var res = new Object();
					res[ "list" ] = new Object();
					
					res[ "list" ][ i ] = new Object();
					res[ "list" ][ i ][ "username" ] = userList[i].member_info.member_info.username;
					res[ "list" ][ i ][ "sex" ] = userList[i].member_info.member_info.sex;
					res[ "list" ][ i ][ "audio" ] = userList[i].audio;
					res[ "list" ][ i ][ "video" ] = userList[i].video;
					res[ "list" ][ i ][ "image_url" ] = userList[i].member_info.member_info.image_url;
					res[ "list" ][ i ][ "profile_url" ] = userList[i].member_info.member_info.profile_url;
					res[ "list" ][ i ][ "userID" ] = userList[i].member_info.member_info.id;
					
					res[ "list" ][ i ][ "member_info" ] = userList[i].member_info;
					
					io.sockets.in(socket.room).emit( 'onGetUserList', res );
				}
			}
			i = null;
        }
        catch (e) {
            amchat.trace("GetUserList catch e = " + e, 'error');
        }
    });
	
	socket.on('ToggleAV', function onToggleAV(audio, video) {
        try {
			amchat.trace("ToggleAV user socket.username " + socket.username );
			amchat.trace("ToggleAV user audio " + audio );
			amchat.trace("ToggleAV user video " + video );
			
			if ( userList[ socket.username ] != null ) {
				//update member object
				userList[ socket.username ].audio = audio;
				userList[ socket.username ].video = video;
			}
			
			io.sockets.in(socket.room).emit('onToggleAV', socket.username , socket.id, audio, video );
        }
        catch (e) {
            amchat.trace("msgFromClient catch e = " + e, 'error');
        }
    });

	socket.on('disconnect', function onDisconnect() {
		try {
			amchat.trace("disconnect user socket.username " + socket.username );
			if ( socket.username == null || socket.username == "undefined" ) {
				delete socket;
				return;
			}
	
			io.sockets.in(socket.room).emit( 'RemoveUser', socket.username );
			
			for (var i in userList) {
				if (userList[i] == socket.username) {
					userList.splice(i, 1);
					--i;
					break;
				}
			}
			i = null;
			
			for ( var i in usernames ) {
				if ( usernames[i] == socket.username ) {
					delete usernames[i];
					--i;
				}
			}
			i = null;
				
			socket.leave(socket.room);
			delete socket;
				
			/*
				socket.feedStream = false;
				if ( socket.ffmpeg_process ) {
					try {
						socket.ffmpeg_process.stdin.end();
						socket.ffmpeg_process.kill('SIGINT');
					}
					catch(e) {
						console.warn('killing ffmpeg process attempt failed...');
					}
				}
				
				socket.feedStream3 = false;
				if ( socket.ffmpeg_process3 ) {
					try {
						socket.ffmpeg_process3.stdin.end();
						socket.ffmpeg_process3.kill('SIGINT');
					}
					catch(e) {
						console.warn('killing ffmpeg_process3 attempt failed...');
					}
				}
	
				if ( socket.renderHLS ) {
					socket.feedStream2 = false;
					if ( socket.ffmpeg_process_record ) {
						try {
							socket.ffmpeg_process_record.stdin.end();
							socket.ffmpeg_process_record.kill('SIGINT');
						}
						catch(e) {
							console.warn('killing ffmpeg process attempt failed...');
						}
					}
					
					if ( socket.snaps ) {
						//do nothing...
						//amchat.trace('disconnect socket.snaps WAS true;');
					}
					else {
						//amchat.trace('disconnect FIRED delete all of the temp files');
						setTimeout( amchat.deleteFiles, 5000, fs, PATH + "fs/" + socket.username + "/", socket.username );
					}
				}
				
				socket.leave(socket.room);
				delete socket;
			*/
		}
        catch (e) {
            amchat.trace("banTo catch e = " + e, 'error');
        }
	});
	
	socket.on('error',function onError(e){
		amchat.trace('socket.on io error:'+e);
	});
	
	socket.on('uncaughtException',function onSocketUncaughtException ( e ){
		amchat.trace('socket.on uncaughtException :' + e );
	});
});

io.on('error',function onIoError(e){
	amchat.trace('io error:'+e);
});

io.on('uncaughtException',function onIoUncaughtException( e ){
	amchat.trace('io uncaughtException:'+e);
});

server.listen(serverPort, function onReaper() {
   amchat.trace('server listening at port ' + serverPort);
    var gcIVL = setInterval(function () {
        try {
            if (typeof global != "undefined") {
                if (typeof global.gc == "function") {
                    global.gc();
                    amchat.trace('GC done');
                }
            }
            amchat.trace("****************** getServerStats ( amchat v_"+amchat.version+" ) ****************** ");

            /* Set server process defaults */
            server_cpu = 0;
            server_mem = 0;
            server_rss = 0;
            server_heapTotal = 0;
            server_heapUsed = 0;
            
            if ( typeof os != "undefined" ) {
                if ( typeof os.cpus == "function" ) {
                    server_cpu = getServerLoad().CPU;
                    amchat.trace('GC - server_cpu = ' + server_cpu + "%");
                    
                    server_mem = getServerLoad().mem;
                    amchat.trace('GC - server_mem = ' + server_mem + "%");
                }
            }
            
            if ( typeof process != "undefined" ) {
                if (typeof process.memoryUsage == "function") {
                    //amchat.calcMemUsage(process.memoryUsage(), "camgirl");
                    
                    server_rss = process.memoryUsage().rss;
                    amchat.trace('GC - server_rss = ' + server_rss);
                    
                    server_heapTotal = process.memoryUsage().heapTotal;
                    amchat.trace('GC - server_heapTotal = ' + server_heapTotal);
                    
                    server_heapUsed = process.memoryUsage().heapUsed;
                    amchat.trace('GC - server_heapUsed = ' + server_heapUsed);
                }
            }
        }
        catch (e) {
            amchat.trace('GC catch e = ' + e, 'error');
        }
    }, 1000 * 30);
});

function getServerLoad() {
    cpus = os.cpus();
    totalTime = -oldCPUTime;
    totalIdle = -oldCPUIdle;
    
    for (var i = 0; i < cpus.length; i++) {
        cpu = cpus[i];
        for (var type in cpu.times) {
            totalTime += cpu.times[type];
            if (type == "idle") {
                totalIdle += cpu.times[type];
            }
        }
    }
    
    CPUload = 100 - Math.round(totalIdle / totalTime * 100);
    oldCPUTime = totalTime;
    oldCPUIdle = totalIdle;
    i = null;
    type = null;
    
    return {
        CPU: CPUload,
        mem: 100 - Math.round(os.freemem() / os.totalmem() * 100)
    }
}

/* compression and base64 handlers */
function decode( str ) {
    return decodeURIComponent( escape( RawDeflate.inflate( _decode( str ) ) ) );
}

var _PADCHAR = "=",
	_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
	_VERSION = "1.0";

function _getbyte64(s, i) {
	var idx = _ALPHA.indexOf(s.charAt(i));
	if (idx === -1) {
		throw "Cannot decode base64"
	}
	return idx
}

function _decode(s) {
	var pads = 0,
		i, b10, imax = s.length,
		x = [];
	s = String(s);
	if (imax === 0) {
		return s
	}
	if (imax % 4 !== 0) {
		throw "Cannot decode base64"
	}
	if (s.charAt(imax - 1) === _PADCHAR) {
		pads = 1;
		if (s.charAt(imax - 2) === _PADCHAR) {
			pads = 2
		}
		imax -= 4
	}
	for (i = 0; i < imax; i += 4) {
		b10 = (_getbyte64(s, i) << 18) | (_getbyte64(s, i + 1) << 12) | (_getbyte64(s, i + 2) << 6) | _getbyte64(s, i + 3);
		x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 255, b10 & 255))
	}
	switch (pads) {
		case 1:
			b10 = (_getbyte64(s, i) << 18) | (_getbyte64(s, i + 1) << 12) | (_getbyte64(s, i + 2) << 6);
			x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 255));
			break;
		case 2:
			b10 = (_getbyte64(s, i) << 18) | (_getbyte64(s, i + 1) << 12);
			x.push(String.fromCharCode(b10 >> 16));
			break
	}
	return x.join("")
}

function _getbyte(s, i) {
	var x = s.charCodeAt(i);
	if (x > 255) {
		throw "INVALID_CHARACTER_ERR: DOM Exception 5"
	}
	return x
}
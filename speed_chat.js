/**
 * @author Ken Murray
 * @version 1.0
 * am_chat - live video chat.
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
applicationData    = null,
data_len           = null,
rooms              = [],
found              = false,
img,data,buf,imgdata,audiobuf,audioBlob,audiodata,cpus,totalTime,totalIdle,cpu,CPUload,vhost,evt,ops,ops3,len,lenres,arrlen,my_str,my_array;

usernames = {},
userList = [];

getIOInstance = function() {
	try {
  		return io;
	}
	catch ( e ) {
		amchat.trace( "getIOInstance catch e = " + e );
	}
};

require("./includes/am.livechat.js");
amchat = new amLiveChat();
amchat.app = 'amchat';
amchat.version = '1.0.0.2';

app.use(express.static('static'));

/* HLS CORS headers */
app.all('*', function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "X-Requested-With");
   res.header('Access-Control-Allow-Headers', 'Content-Type');
   next();
});

io.sockets.on('connection', function onConnect(socket) {
	//socket.emit('message','server connected!');
	socket.on('adduser', function onAddUser(client) {
		try {
			//amchat.trace( "adduser FIRED client.username = " + client.username );
			if ( client.username == null || client.username == "" || client.username == "undefined" ) {
                socket.disconnect(true);
                return;
            }
			
			socket.username = client.username;
			//amchat.trace("socket.username = " + client.username);
			
            socket.userID = client.userID;
            //amchat.trace("socket.userID = " + client.userID);

            socket.sessionName = client.sessionName;
			//amchat.trace("socket.sessionName = " + client.sessionName);
			
            socket.session_id = client.session_id;
			//amchat.trace("socket.session_id = " + client.session_id);
			
            socket.gateway = client.gateway;
			//amchat.trace("socket.gateway = " + client.gateway);
			
            socket.room = client.room;
			//amchat.trace("socket.room = " + socket.room);
            
            socket.usertype = client.usertype;
			//amchat.trace("socket.usertype = " + client.usertype);
			
            socket.type = client.usertype;
			//amchat.trace("socket.type = " + socket.type );
			
			socket.appname = client.appname;
			//amchat.trace("socket.appname = " + socket.appname );

			socket.count = 0;
			socket.audiocount = 0;

			if ( client.volume != null && client.volume != "" && client.volume != "undefined" ) {
				socket.volume = client.volume;
			}
			else {
				socket.volume = '0.5';
			}

			socket.recording = false;

			if ( client.useOgg != null && client.useOgg != "" ) {
				socket.useOgg = client.useOgg;
			}
			else {
				socket.useOgg = false;
			}

			if ( client.frameRate != null && client.frameRate != "" ) {
				socket.frameRate = client.frameRate;
			}
			else {
				socket.frameRate = "4";
			}

			if ( client.renderHLS != null && client.renderHLS != "" ) {
				socket.renderHLS = client.renderHLS;
			}
			else {
				socket.renderHLS = false;
			}

			found = false;
			// Determine if the room exists.
			for ( var i in rooms ) {
				if ( rooms.hasOwnProperty(i) ) {
					if ( rooms[i] == client.room ) {
						found = true;
					}
				}
			}
			i = null;
			
			// If not found add it to room list;
			if ( !found ) {
				rooms.push( client.room );
			}
			
			if ( client.username != null ) {
				if ( client.appname === 'amChatConnMember' && client.usertype == '4' ) {
					userList.push( client.username );
					userList[ client.username ] = {};
					userList[ client.username ] = client;
				
					userList[ client.username ].session_id = socket.session_id;
					userList[ client.username ].username = socket.username;
					userList[ client.username ].roomID = socket.id;
					
					userList[ client.username ].keepalive_failures = 0;
					userList[ client.username ].keepalive_checks = 3;
					userList[ client.username ].keepalive_check_ivl = -1;
		
					userList[ client.username ].socket = socket;
					userList[ client.username ]['clients'] = [];
					userList[ client.username ]['clients'].push( socket );

					amchat.member_connect( client, io );
				}
				else {
					if ( client.appname === 'AM Chat Module' && client.usertype == '8' ) {
						amchat.member_connect( client, io );
					}
					else {
						client.socket.emit('access_denied_msg');
						client.socket.disconnect(true);
					}
				}
				
				socket.join(client.room);
				socket.emit('onadduser','adding user: ' + client.username + " room: " + client.room );
			}
		}
		catch ( e ) {
			amchat.trace( "adduser catch e = " + e );
		}
	});
	
	socket.on('on_keepalive_check', function onHeartBeat( username, heartbeat ) {
        try {
            //amchat.trace( "socket - on_keepalive_check FIRED" );
            amchat.on_keepalive_check ( username, heartbeat );
        }
        catch( e ) {
            wccUtilService.trace("on_keepalive_check catch e =  " + e,'error' );
        }
    });

	socket.on('WatchUser', function onWatchUser( roomIndex, userToWatch ) {
        try {
			if ( userList[userToWatch] != null && userList[userToWatch].socket ) {
           	 	userList[userToWatch].socket.emit( 'onWatchingMe', roomIndex, socket.username );
			}
			else {
				amchat.trace("WatchUser user socket WAS null");
			}
        }
        catch (e) {
            amchat.trace("WatchUser catch e = " + e, 'error');
        }
    });
	
	socket.on('RemoveWatcher', function onRemoveWatcher( roomIndex, userToRemove ) {
        try {
			if ( userList[userToRemove] != null && userList[userToRemove].socket ) {
           	 	userList[userToRemove].socket.emit( 'onRemoveWatcher', roomIndex, socket.username );
			}
			else {
				amchat.trace("RemoveWatcher user socket WAS null");
			}
        }
        catch (e) {
            amchat.trace("RemoveWatcher catch e = " + e, 'error');
        }
    });
	
	socket.on('msgFromClient', function onMsgFromClient(msg) {
        try {
			io.sockets.in(socket.room).emit('msgFromServer', socket.username , msg );
        }
        catch (e) {
            amchat.trace("msgFromClient catch e = " + e, 'error');
        }
    });

	socket.on('whisperTo', function onWhisperTo(username, msg, sender) {
        try {
			if ( userList[username] != null && userList[username].socket ) {
           	 	userList[username].socket.emit('setHistory', username, msg, sender);
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
					socket.emit('on_kick_remove_mod', username );
					//amchat.trace("kickTo user is_moderator - abort");
					return;
				}
				
				socket.is_moderator = userList[ socket.username ].is_moderator;
				if ( socket.is_moderator ) {
					io.sockets.in(socket.room).emit( 'RemoveUser', username );
					
					userList[username].socket.emit('do_kicked_msg');
					userList[username].socket.disconnect(true);
					
					socket.emit('on_kick_remove_user', username );
				}
				else {
					//Close this connection for attempting a ban;
					userList[socket.username].socket.emit('do_banned_msg_2');
					userList[socket.username].socket.disconnect(true);
				}
			}
			else {
				//amchat.trace("kickTo user socket WAS null");
				socket.emit('on_kick_remove_user', null );
			}
        }
        catch (e) {
            amchat.trace("kickTo catch e = " + e, 'error');
        }
    });
	
	socket.on('banTo', function onBanTo(username, reasonToBan, permanent, err) { 
        try {
			//amchat.trace("banTo username = " + username + " reasonToBan = " + reasonToBan + " permanent = " + permanent );
			if ( userList[username] != null && userList[username].socket ) {
				
				if ( userList[username].member_info.member_info.is_moderator ) {
					socket.emit('on_ban_remove_mod', username );
					//amchat.trace("banTo user is_moderator - abort");
					return;
				}

				/*
				amchat.trace("banTo userList[username].member_info.member_info.username = " + userList[username].member_info.member_info.username );
				amchat.trace("banTo userList[username].username = " + userList[username].username );
				amchat.trace("banTo userList[username].ip = " + userList[username].ip );
				amchat.trace("banTo userList[username].is_moderator = " + userList[ username ].is_moderator );
				*/
				
				socket.is_moderator = userList[ socket.username ].is_moderator;

				if ( socket.is_moderator ) {
					io.sockets.in(socket.room).emit( 'RemoveUser', username );

					amchat.BanUser(socket, userList[username].ip , userList[username].username, reasonToBan, permanent);
					
					userList[username].socket.emit('do_banned_msg');
					userList[username].socket.disconnect(true);
					
					socket.emit('on_ban_remove_user', username );
				}
				else {
					//Close this connection for attempting a ban;
					userList[socket.username].socket.emit('do_banned_msg_2');
					userList[socket.username].socket.disconnect(true);
				}
			}
			else {
				//amchat.trace("banTo user socket WAS null");
				socket.emit('on_ban_remove_user', null );
			}
        }
        catch (e) {
            amchat.trace("banTo catch e = " + e, 'error');
        }
    });
	
	socket.on('GetUserList', function onGetUserList( roomIndex ) {
        try {
			//amchat.trace("GetUserList userList.length " + userList.length );
			for ( var i in userList ) {
				if ( userList.hasOwnProperty(i) ) {
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
			}
			i = null;
        }
        catch (e) {
            amchat.trace("GetUserList catch e = " + e, 'error');
        }
    });
	
	socket.on('ToggleAV', function onToggleAV(audio, video) {
        try {
			if ( userList[ socket.username ] != null ) {
				userList[ socket.username ].audio = audio;
				userList[ socket.username ].video = video;
			}
			io.sockets.in(socket.room).emit('onToggleAV', socket.username , socket.id, audio, video );
        }
        catch (e) {
            amchat.trace("msgFromClient catch e = " + e, 'error');
        }
    });
	
	/* If using socket MJPG method */
	socket.on('sendvideo', function onSendVideo(bArray) {
        try {
			if ( bArray != null && bArray[0] != null && bArray[0].frames != null ) {
				socket.snaps = true;
				if ( bArray[0].fpsIVL != null ) {
					socket.frameRate = ( 1000 / parseFloat( bArray[0].fpsIVL ) );
				}
				if ( bArray[0].frames[0].indexOf("data:image" ) != -1 ) {
					socket.broadcast.to(socket.room).emit('updatevideo', socket.username, bArray);
					//io.sockets.in(socket.room).emit('updatevideo', socket.username , bArray );
				}
			}
        }
        catch (e) {
            amchat.trace("sendvideo catch e = " + e, 'error');
        }
    });
	
	/* If using socket Audio segment method */
	socket.on('sendaudio', function onSendAudio(bArray) {
        try {
			if ( bArray != null && bArray[0] != null && bArray[0].audioBlob != null ) {
				if ( bArray[0].audioBlob.indexOf("data:audio" ) != -1 ) {
					socket.broadcast.to(socket.room).emit('updateaudio', socket.username, bArray);
					//io.sockets.in(socket.room).emit('updateaudio', socket.username , bArray );
				}
			}
        }
        catch (e) {
             amchat.trace("updateaudio catch e = " + e, 'error');
        }
    });
	
	socket.on("closeMe", function onCloseMe() {
        amchat.trace("closeMe FIRED socket = " + socket );
        if ( typeof socket == "object" && socket !== null ) {
            socket.disconnect(true);
        }
    });

	socket.on('disconnect', function onDisconnect() {
		try {
			amchat.trace("disconnect user socket.username " + socket.username );
			if ( socket.username == null || socket.username == "undefined" ) {
				delete socket;
				return;
			}

			amchat.removeUserFromList( io, socket.room, socket.username );

			socket.leave(socket.room);
			delete socket;
		}
        catch (e) {
            amchat.trace("disconnect catch e = " + e, 'error');
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
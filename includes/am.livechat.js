
/**
 * amLiveChat extends am-chat app
 *
 */
http = require('http'); 

amLiveChat = (function () {
	var _amLiveChat = function() {
		var now,
			timestamp,
			len,
			lenres,
			arrlen,
			member_info,
            app = 'null',
			MIN_PAID_STATUS = 2,
            version  = 'null';
		
		this.trace = function ( msg, level ) {
            try {
                now = new Date();
                timestamp = now.toJSON();
				/*
                if ( level == null ) {
                   logger.info({
                        'timestamp': timestamp,
                        'message': msg,
                        'level': 'info',
                        'app' : thisChat.app,
                        'version' : thisChat.version
                      }
                   );
                }
                else {
                    logger.error({
                        'timestamp': timestamp,
                        'level': 'error',
                        'message': msg,
                        'app' : thisChat.app,
                        'version' : thisChat.version
                      }
                    )
                }
				*/
                console.log( msg );
            }
            catch ( e ) {
                console.log("trace catch e = " + e );
            }
		};
		
		this.member_connect = function ( client , io ) {
			try {
				thisChat.trace( "member_connect client.gateway "+ client.gateway );
				var obj = [client.session_id, "member",  client.ip];
				post_data = JSON.stringify({"serviceName": "AMService", "methodName": "member_connect", "parameters": obj});
				
				/* gateway2 method
				 e = {};
				 e.args = [client.session_id, "member",  client.ip];
				 e.method = 'AMService.member_connect';
				 
				 post_data = JSON.stringify ( e );
				*/
				
				options = {
					host: client.gateway,
					port: '80',
					//path: 'http://'+client.gateway+'/flashservices/gateway2.php?m=BanUser&'+client.sessionName+'='+ client.session_id,
					path: "http://"+client.gateway+"/gateway.php?contentType=application/json",
					method: 'POST',
					
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Content-Length': post_data.length
					}
				};
				
				req = http.request(options, function(response) {
					response.on('data', function(result) {
						try {
							//thisChat.trace( "member_connect RESULT result " + result );
							
							member_info = JSON.parse(result);
							
							thisChat.trace( "************************************ member_connect_Result ************************************" );
							thisChat.trace("member_connect_Result member_info.username : " + member_info.member_info.username);
							thisChat.trace("member_connect_Result member_info.id : " + member_info.member_info.id);
							thisChat.trace("member_connect_Result member_info.type : " + member_info.member_info.type);
							thisChat.trace("member_connect_Result member_info.is_moderator : " + member_info.member_info.is_moderator);
							thisChat.trace("member_connect_Result is_banned : " + member_info.is_banned);
							
							/*
							thisChat.trace("member_connect_Result member_info.age : " + member_info.member_info.age);
							thisChat.trace("member_connect_Result member_info.sex : " + member_info.member_info.sex);
							thisChat.trace("member_connect_Result member_info.sex_pref : " + member_info.member_info.sex_pref);
							thisChat.trace("member_connect_Result member_info.city : " + member_info.member_info.city);
							thisChat.trace("member_connect_Result member_info.state : " + member_info.member_info.state);
							thisChat.trace("member_connect_Result member_info.country : " + member_info.member_info.country);
							thisChat.trace("member_connect_Result member_info.large_image_url : " + member_info.member_info.large_image_url);
							
							thisChat.trace("member_connect_Result member_info.profile_url : " + member_info.member_info.profile_url);
							thisChat.trace("member_connect_Result member_info.image_url : " + member_info.member_info.image_url);
							thisChat.trace("member_connect_Result is_logged : " + member_info.is_logged);
							thisChat.trace("member_connect_Result member_info.status : " + member_info.member_info.status);
							thisChat.trace("member_connect_Result MIN_PAID_STATUS : " + MIN_PAID_STATUS);
							*/

							if ( member_info.is_banned ) {
								//need to boot this user
								client.socket.emit('do_banned_msg');
								client.socket.disconnect(true);
							}
							else if ( ( member_info.member_info.status == null ) || ( member_info.member_info.status < MIN_PAID_STATUS ) ) {
								thisChat.trace( "!! user is not a paying member - " + client.username + " !!" );
								client.socket.emit('access_denied_msg');
								client.socket.disconnect(true);
							}
							else {
								thisChat.trace("member_connect_Result calling AddUser for " + client.username);
								userList[ client.username ].member_info = member_info;
								userList[ client.username ].audio = client.audio;
								userList[ client.username ].video = client.video;
								io.sockets.in(client.room).emit('AddUser', member_info, client.audio, client.video );
							}
						}
						catch( e ) {
							thisChat.trace("member_connect response catch e =  " + e, 'error' );
						}
					});
					
					response.on('end', function() {
						//
					});
				});
				
				req.on('error', function(e) {
					 thisChat.trace("member_connect req error " + e , 'error');
				});
				
				req.write(post_data);
				req.end();
			}
            catch ( e ) {
                thisChat.trace("member_connect catch e = " + e );
            }
		};
		
		this.get_user_list = function ( client ) {
			 try {
				 //thisChat.trace("get_user_list FIRED" );
		         if ( client.room != null && userList != null && userList[ client.room ] != null && userList[ client.room ]['clients'] != null ) {
					 // thisChat.trace("get_user_list client.room " +  client.room );
					 
					 for ( var clientId in userList[ client.room ]['clients'] ) {
						 var res = new Object();
						 res[ "list" ] = new Object();
						 
						 res[ "list" ][ clientId ] = new Object();
						 res[ "list" ][ clientId ][ "username" ] = userList[ client.room ]['clients'][clientId].username;
						 res[ "list" ][ clientId ][ "userID" ] = userList[ client.room ]['clients'][clientId].userID;
	 
						 thisChat.trace("get_user_list username = " +  userList[ client.room ]['clients'][clientId].username );
						 
						 client.emit('get_user_list', res, 0 );
					 }
					 //thisChat.trace("room: member_count = " + userList[ client.room ].member_count);
				 }
				 else {
					  //thisChat.trace("get_user_list client.room WAS null" );
				 }
				 clientId = null;
				 res = null;
			 }
			 catch( e ) {
				  thisChat.trace("get_user_list catch e =  " + e, 'error' );
			 }
		 };

		 this.zeroPad = function(nr,base) {
			try {
				len = ( String( base ).length - String( nr ).length ) + 1;
				if ( arrlen != null ) {
					arrlen = null;
				}
				arrlen = new Array(len);
				lenres = len > 0 ? arrlen.join('0') + nr : nr;
		
				return lenres;
			}
			catch( e ) {
				thisChat.trace("zeroPad catch e = "+ e);
			}
		};
		
		this.mkdirSync = function( fs, path, useOgg ) {
			try {
				if ( !fs.existsSync( path ) ) {
					try {
						fs.mkdirSync( path, 0755, function( err ) {
							if ( err ) { 
								thisChat.trace("ERROR! mkdirSync Can't make the directory! err = " + err );   
							}
							
							if ( !useOgg ) {
								fs.appendFile( path + '/audiolist.txt', '', function (err) {
									if ( err ) {
										thisChat.trace("ERROR! mkdirSync Can't appendFile! err = " + err ); 
									}
									thisChat.trace('audiolist created!');
								});
							}
						});  
					}
					catch( e ) {
						thisChat.trace('mkdirSync catch  e = ' + e );
					}
				}
				else {
					if ( !useOgg ) {
						//directory exists so just clear the manifest
						fs.writeFile( path + '/audiolist.txt', '', function( err ) {
							if ( err ) { 
								thisChat.trace("ERROR! mkdirSync Can't clear the manifest! err = " + err ); 
							}
							thisChat.trace('audiolist WAS cleared');
						});
					}
				}
			} 
			catch(e) {
				thisChat.trace('existsSync catch  e = ' + e );
			}
		};
		
		this.deleteFiles = function( fs, INPUT_PATH, activeModel ) {
			try {
				fs.readdir( INPUT_PATH, function( err, files ) {
					if ( err ) {
						thisChat.trace( "err detected: "+ err.code.toString());
					}
					else if ( err && err.code == "ENOENT" ){
					   thisChat.trace( "err.code: ENOENT detected ");
					}
					else {
						if ( files != null && files.length ) {
							for ( var k = 0; k < files.length; k++ ) {
								
								//remove jpg snaps
								if ( files[ k ].indexOf(".jpg") != -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisChat.callback );
									}
								}
								
								//remove .wav segments
								if ( files[ k ].indexOf(".wav") != -1 && files[ k ].indexOf("_audiosnaps_") == -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisChat.callback );
									}
								}
								
								//remove .mp3 segments
								if ( files[ k ].indexOf(".mp3") != -1 && files[ k ].indexOf("_audiosnaps_") == -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisChat.callback );
									}
								}
								
								//remove manifest file
								if ( files[ k ].indexOf(".txt") != -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisChat.callback );
									}
								}
								
								//remove _audiosnaps_ file
								if ( files[ k ].indexOf("_audiosnaps_") != -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisChat.callback );
									}
								}
								
								//remove _videosnaps_ file
								if ( files[ k ].indexOf("_videosnaps_") != -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisChat.callback );
									}
								}
								
								//remove .ts segments
								if ( files[ k ].indexOf(".ts") != -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisChat.callback );
									}
								}
								
								//remove .mkv temp audio holder
								if ( files[ k ].indexOf(".mkv") != -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisChat.callback );
									}
								}
								
								//remove HLS manifest
								if ( files[ k ].indexOf(".m3u8") != -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisChat.callback );
									}
								}
							}
							k = null;
						}
					}
				});
			} 
			catch(e) {
				thisChat.trace('deleteFiles catch  e = ' + e );
			}
		};

		this.callback = function ( err ) {
			if ( err ) {
				thisChat.trace('callback err ' + err );
			}
		};

		thisChat = this;
	};
	
	return _amLiveChat;
})();

exports.amLiveChat = amLiveChat;

module.exports = function (parent) {
    return child = {
        target: function() {
            parent.f();
        }
    };
}

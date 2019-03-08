
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
		
		this.BanUser = function ( client, clientToBanIP, clientToBanName, reasonToBan, permanent ) {
			try {
				thisChat.trace( "BanUser clientToBanIP = "+ clientToBanIP );
				thisChat.trace( "BanUser clientToBanName = "+ clientToBanName );
				thisChat.trace( "BanUser username = "+ client.username );
				thisChat.trace( "BanUser userID = "+ client.userID );
				thisChat.trace( "BanUser session_id = "+ client.session_id );	
				thisChat.trace( "BanUser client.is_moderator = "+ client.is_moderator );
				
				if ( !client.is_moderator ){
					thisChat.trace( client.username + " is not a moderator, aborting admin function" );
					return;
				}
				else {
					thisChat.trace( client.username + " is a moderator, continue with ban!" );
				}

				var obj = [ clientToBanIP, clientToBanName, client.username, client.userID, client.session_id, reasonToBan ];
				post_data = JSON.stringify({"serviceName": "AMService", "methodName": "BanUser", "parameters": obj});
			
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
					response.on('data', function(data) {
						try {
							thisChat.trace( "BanUser RESULT data " + data );
						}
						catch( e ) {
							thisChat.trace("BanUser response catch e =  " + e, 'error' );
						}
					});
					
					response.on('end', function() {
						//
					});
				});
				
				req.on('error', function(e) {
					 thisChat.trace("BanUser req error " + e , 'error');
				});
				
				req.write(post_data);
				req.end();
			}
            catch ( e ) {
                thisChat.trace("BanUser catch e = " + e );
            }
		};
		
		this.member_connect = function ( client , io ) {
			try {
				//thisChat.trace( "member_connect client.gateway "+ client.gateway );
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
							
							/*
							thisChat.trace( "************************************ member_connect_Result ************************************" );
							thisChat.trace("member_connect_Result member_info.username : " + member_info.member_info.username);
							thisChat.trace("member_connect_Result member_info.id : " + member_info.member_info.id);
							thisChat.trace("member_connect_Result member_info.type : " + member_info.member_info.type);
							thisChat.trace("member_connect_Result member_info.is_moderator : " + member_info.member_info.is_moderator);
							thisChat.trace("member_connect_Result is_banned : " + member_info.is_banned);
							
							
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
								if ( client.appname === 'AM Chat Module' && client.usertype == '8' ) {
									io.sockets.in(client.room).emit('AddGuest', client.username, client.userID );
								}
								else {
									//thisChat.trace( "!! user is not a paying member - " + client.username + " !!" );
									client.socket.emit('access_denied_msg');
									client.socket.disconnect(true);
								}
							}
							else {
								//thisChat.trace("member_connect_Result calling AddUser for " + client.username);
								userList[ client.username ].member_info = member_info;
								userList[ client.username ].audio = client.audio;
								userList[ client.username ].video = client.video;
								userList[ client.username ].is_moderator = member_info.member_info.is_moderator;
								io.sockets.in(client.room).emit('AddUser', member_info, client.audio, client.video );
						
								clearInterval( userList[ client.username ].keepalive_check_ivl );
								userList[ client.username ].keepalive_check_ivl = setInterval( thisChat.keepalive_check, 30000, client );
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

		 this.keepalive_check = function( client ) {
			 try {
				 //thisChat.trace("keepalive_check client.username "+ client.username );
				 for ( var j in userList ) {
					 if ( userList[j].username != null
						 && userList[j].username != "undefined"
						 && userList[j].username == client.username ) {
	
						 if ( userList[j].keepalive_failures <= userList[j].keepalive_checks ) {
							 userList[j].foundResult = false;
							 ++userList[j].keepalive_failures;
							 
							 //thisChat.trace("client.username = " + client.username );
							 //thisChat.trace("userList[j].username = " + userList[j].username );
							 //thisChat.trace("userList[j].keepalive_failures = " + userList[j].keepalive_failures );
							 //thisChat.trace("userList[j].keepalive_checks = " + userList[j].keepalive_checks );
							 client.socket.emit('heartbeat', client.username);
						 }
						 else {
							 //thisChat.trace( client.username + " must be gone need to clear them from the list else we have a ghost!");
							 thisChat.removeUserFromList( null, client.room, client.username );
						 }
						 break;
					 }
				 }
				 j = null;
			 }
			 catch( e ) {
				 thisChat.trace("zeroPad catch e = "+ e);
			 }
		 },
		 
		 this.on_keepalive_check = function( username, heartbeat ) {
             try {
				 //thisChat.trace( "this.on_keepalive_check username = " + username + " heartbeat = " + heartbeat );
				 if ( heartbeat == 7 ) {
					 for ( var j in userList ) {
						 if ( userList[j].username != null
							 && userList[j].username != "undefined"
							 && userList[j].username == username ) {
		
							 //thisChat.trace( "on_keepalive_check result was " + heartbeat + " for " +  username + " Setting foundResult to true" );
							 userList[j].foundResult = true;
							 userList[j].keepalive_failures = 0;
							 break;
						 }
					 }
					 j = null;
				 }
			 }
			 catch( e ) {
				 thisChat.trace("on_keepalive_check catch e = "+ e);
			 }
         },
		 
		 this.removeUserFromList = function(io, room, usr) {
			try {
				//thisChat.trace("removeUserFromList usr = "+ usr);
				if ( io == null ) {
					io = getIOInstance();
				}

				io.sockets.in(room).emit( 'RemoveUser', usr );
				
				for (var i in userList) {
					if ( userList.hasOwnProperty(i) ) {
						if ( userList[i] == usr ) {
							clearInterval( userList[ usr ].keepalive_check_ivl );
							userList.splice(i, 1);
							--i;
							break;
						}
					}
				}
				i = null;

				for ( var j in usernames ) {
					if ( usernames.hasOwnProperty(j) ) {
						if ( usernames[j] == usr ) {
							delete usernames[j];
							--j;
						}
					}
				}
				j = null;
			}
			catch( e ) {
				thisChat.trace("removeUserFromList catch e = "+ e);
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


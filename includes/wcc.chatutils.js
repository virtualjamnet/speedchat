
/**
 * wccUtils extends cams-video apps
 *
 */
 
wccUtils = (function () {
	var _wccUtils = function() {
		var now,
			timestamp,
			len,
			lenres,
			arrlen,
            app                = 'null',
            version            = 'null';
		
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
                        'app' : thisUtils.app,
                        'version' : thisUtils.version
                      }
                   );
                }
                else {
                    logger.error({
                        'timestamp': timestamp,
                        'level': 'error',
                        'message': msg,
                        'app' : thisUtils.app,
                        'version' : thisUtils.version
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
				thisUtils.trace("zeroPad catch e = "+ e);
			}
		};
		
		this.mkdirSync = function( fs, path, useOgg ) {
			try {
				if ( !fs.existsSync( path ) ) {
					try {
						fs.mkdirSync( path, 0755, function( err ) {
							if ( err ) { 
								thisUtils.trace("ERROR! mkdirSync Can't make the directory! err = " + err );   
							}
							
							if ( !useOgg ) {
								fs.appendFile( path + '/audiolist.txt', '', function (err) {
									if ( err ) {
										thisUtils.trace("ERROR! mkdirSync Can't appendFile! err = " + err ); 
									}
									thisUtils.trace('audiolist created!');
								});
							}
						});  
					}
					catch( e ) {
						thisUtils.trace('mkdirSync catch  e = ' + e );
					}
				}
				else {
					if ( !useOgg ) {
						//directory exists so just clear the manifest
						fs.writeFile( path + '/audiolist.txt', '', function( err ) {
							if ( err ) { 
								thisUtils.trace("ERROR! mkdirSync Can't clear the manifest! err = " + err ); 
							}
							thisUtils.trace('audiolist WAS cleared');
						});
					}
				}
			} 
			catch(e) {
				thisUtils.trace('existsSync catch  e = ' + e );
			}
		};
		
		this.deleteFiles = function( fs, INPUT_PATH, activeModel ) {
			try {
				fs.readdir( INPUT_PATH, function( err, files ) {
					if ( err ) {
						thisUtils.trace( "err detected: "+ err.code.toString());
					}
					else if ( err && err.code == "ENOENT" ){
					   thisUtils.trace( "err.code: ENOENT detected ");
					}
					else {
						if ( files != null && files.length ) {
							for ( var k = 0; k < files.length; k++ ) {
								
								//remove jpg snaps
								if ( files[ k ].indexOf(".jpg") != -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisUtils.callback );
									}
								}
								
								//remove .wav segments
								if ( files[ k ].indexOf(".wav") != -1 && files[ k ].indexOf("_audiosnaps_") == -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisUtils.callback );
									}
								}
								
								//remove .mp3 segments
								if ( files[ k ].indexOf(".mp3") != -1 && files[ k ].indexOf("_audiosnaps_") == -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisUtils.callback );
									}
								}
								
								//remove manifest file
								if ( files[ k ].indexOf(".txt") != -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisUtils.callback );
									}
								}
								
								//remove _audiosnaps_ file
								if ( files[ k ].indexOf("_audiosnaps_") != -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisUtils.callback );
									}
								}
								
								//remove _videosnaps_ file
								if ( files[ k ].indexOf("_videosnaps_") != -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisUtils.callback );
									}
								}
								
								//remove .ts segments
								if ( files[ k ].indexOf(".ts") != -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisUtils.callback );
									}
								}
								
								//remove .mkv temp audio holder
								if ( files[ k ].indexOf(".mkv") != -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisUtils.callback );
									}
								}
								
								//remove HLS manifest
								if ( files[ k ].indexOf(".m3u8") != -1 ) {
									if ( INPUT_PATH + "/" + files[ k ] != null ) {
										fs.unlink( INPUT_PATH + "/" + files[ k ] , thisUtils.callback );
									}
								}
							}
							k = null;
						}
					}
				});
			} 
			catch(e) {
				thisUtils.trace('deleteFiles catch  e = ' + e );
			}
		};

		this.callback = function ( err ) {
			if ( err ) {
				thisUtils.trace('callback err ' + err );
			}
		};

		thisUtils = this;
	};
	
	return _wccUtils;
})();

exports.wccUtils = wccUtils;

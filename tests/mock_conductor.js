// const path				= require('path');
// const log				= require('@whi/stdlog')(path.basename( __filename ), {
//     level: process.env.LOG_LEVEL || 'fatal',
// });


// const fetch				= require('node-fetch');
// const SerializeJSON			= require('json-stable-stringify');

// const { Server : WebSocketServer,
// 	Client : WebSocket }		= require('../build/wss.js');
// const { KeyManager,
// 	Codec, }			= require('@holo-host/cryptolib');

// const { struct, superstruct }		= require('superstruct');

// NB: We are no longer using sha256 to hash the encrypted data, instead use holohash pattern. 
// const sha256				= (buf) => crypto.createHash('sha256').update( Buffer.from(buf) ).digest();

// function ZomeAPIResult ( result ) {
//     return JSON.stringify({
// 	"Ok": result,
//     });
// }
// function ZomeAPIError ( result ) {
//     return JSON.stringify({
// 	"Err": result,
//     });
// }

// const holo_struct = superstruct({
//     types: {
// 	"agent_id": value => {
// 	    return Codec.AgentId.decode( value ) && true;
// 	},
// 	"hash": value => {
// 	    return Codec.Digest.decode( value ) && true;
// 	},
// 	"signature": value => {
// 	    return Codec.Signature.decode( value ) && true;
// 	},
// 	"iso_string": value => {
// 	    const d = new Date( value );
// 	    return value === d.toISOString().replace("Z","+00:00");
// 	},
//     },
// });

// const agents				= {};
// const MockMaster = {
//     "admin": {
// 	"agent": {
// 	    async list ( args ) {
// 		// Example response
// 		//
// 		//     [{
// 		//         "id":"host-agent",
// 		//         "name":"Host Agent",
// 		//         "public_address":"HcSCIk4TB9g386Ooeo49yH57VFPer6Guhcd5BY8j8wyRjjwmZFKW3mkxZs3oghr",
// 		//         "keystore_file":"/var/lib/holochain-conductor/holo",
// 		//         "holo_remote_key":null,
// 		//         "test_agent":null
// 		//     }]
// 		//
// 		return Object.values( agents );
// 	    },

// 	    async add ( args ) {
// 		let success		= false;
// 		try {
// 		    agents[ args.id ] = {
// 			"id":			args.id,
// 			"name":			args.name,
// 			"public_address":	args.holo_remote_key,
// 			"keystore_file":	"::ignored::",
// 			"holo_remote_key":	true,
// 			"test_agent":		null,
// 		    };
// 		    success		= true;
// 		} catch ( err ) {
// 		    log.error("Master admin/agent/add error: %s", String(err) );
// 		}

// 		return { "success": success };
// 	    },
// 	},
// 	"instance": {
// 	    async add ( args ) {
// 		return { "success": true };
// 	    },

// 	    async start ( args ) {
// 		return { "success": true };
// 	    },
// 	},
// 	"interface": {
// 	    async add_instance ( args ) {
// 		return { "success": true };
// 	    },
// 	},
//     },
// };

// // A fake Provenance and Iso8601 timestamp for servicelogger response "meta"
// const provenance = (
//     "HcScJhCTAB58mkeen7oKZrgxga457b69h7fV8A9CTXdTvjdx74fTp33tpcjitgz",
//     "XxHr36xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxCg=="
// );
// const timestamp = "2019-12-03T07:10:22Z";



// const request_input_superstruct = holo_struct({
//     "agent_id": "agent_id",
//     "request": {
// 	"timestamp": "iso_string",
// 	"host_id": "agent_id",
// 	"call_spec": {
// 	    "hha_hash": "hash",
// 	    "dna_alias": "string",
// 	    "zome": "string",
// 	    "function": "string",
// 	    "args_hash": "hash"
// 	}
//     },
//     "request_signature": "signature",
// });
// const response_input_superstruct = holo_struct({
//     "request_commit": "hash",
//     "response_hash": "hash",
//     "host_metrics": "object",
//     "entries": "array",
// });
// const service_input_superstruct = holo_struct({
//     "agent_id": "agent_id",
//     "response_commit": "hash",
//     "confirmation": {
// 	"response_hash": "hash",
// 	"client_metrics": {
// 	    "duration": "string"
// 	}
//     },
//     "confirmation_signature": "signature"
// });

// const utf8				= new TextEncoder();

// const MockServiceLogger = {
//     "verifyPayload": ( agent_id, payload, payload_signature ) => {
// 	const serialized		= SerializeJSON( payload );

// 	log.silly("Verifying signature (%s) is Agent (%s) for message: %s", payload_signature, agent_id, serialized );
// 	const sig_bytes			= Codec.Signature.decode( payload_signature );
// 	const public_key		= Codec.AgentId.decode( agent_id );

// 	return KeyManager.verifyWithPublicKey( utf8.encode(serialized), sig_bytes, public_key );
//     },

//     "service": {
// 	async log_request ( args ) {
// 	    if ( Conductor.send_serialization_error === true ) {
// 		log.warn("Sending custom serialization error because 'this.send_serialization_error' is set to '%s'", Conductor.send_serialization_error );
// 		Conductor.send_serialization_error	= false;
// 		return {
// 		    "SerializationError": "Cannot decompress Edwards point at line 1 column 208",
// 		};
// 	    }

// 	    // Validate input
// 	    request_input_superstruct( args );

// 	    const {
// 		agent_id,
// 		request,
// 		request_signature
// 	    }				= args;

// 	    if ( this.verifyPayload( agent_id, request, request_signature ) !== true ) {
// 		log.error("Failed during payload verification for log request (%s)", request_signature );
// 		throw new Error("Signature does not match request payload");
// 	    }


// 	    if ( typeof request.timestamp !== "string" ) {
// 		log.error("Failed during request timestamp check: should be 'string', not type '%s'", typeof request.timestamp );
// 		throw new Error(`invalid type: integer \`${request.timestamp}\`, expected a string at line 1 column 114`);
// 	    }

// 	    if ( Date.parse( request.timestamp ) === NaN ) {
// 		log.error("Failed during request timestamp check: could not parse date '%s'", request.timestamp );
// 		throw new Error(`invalid date: ${request.timestamp}`);
// 	    }

// 	    const entry			= SerializeJSON( args );
// 	    const address		= Codec.Digest.encode( sha256( entry ) );

// 	    log.info("Returning commit address (%s) for service log request (%s)", address, request_signature );
// 	    return ZomeAPIResult(address);
// 	},
	
// 	async log_response ( args ) {
// 	    // Validate input
// 	    response_input_superstruct( args );

// 	    const {
// 		request_commit,
// 		response_hash,
// 		host_metrics,
// 		entries
// 	    }				= args;
// 	    const entry			= SerializeJSON( args );
// 	    const address		= Codec.Digest.encode( sha256( entry ) );

// 	    log.info("Returning commit address (%s) for service log response (%s)", address, response_hash );
// 	    return ZomeAPIResult(address);
// 	},

// 	async log_service ( args ) {
// 	    // log.silly("Input: %s", JSON.stringify(args,null,4) );
// 	    // Validate input
// 	    service_input_superstruct( args );

// 	    const {
// 		agent_id,
// 		response_commit,
// 		confirmation,
// 		confirmation_signature
// 	    }				= args;
// 	    if ( this.verifyPayload( agent_id, confirmation, confirmation_signature ) !== true ) {
// 		log.error("Failed during payload verification for log confirmation (%s)", confirmation_signature );
// 		throw new Error("Signature does not match confirmation payload");
// 	    }

// 	    const entry			= SerializeJSON( args );
// 	    const address		= Codec.Digest.encode( sha256( entry ) );

// 	    log.info("Returning commit address (%s) for service log confirmation (%s)", address, confirmation_signature );
// 	    return ZomeAPIResult(address);
// 	},
//     }
// };

// const MockHappStore = {
//     "happs": {
// 	async get_app ( args ) {
// 	    //     {
// 	    //         "address":              Address,
// 	    //         "app_entry": {
// 	    //             "title":            String,
// 	    //             "author":           String,
// 	    //             "description":      String,
// 	    //             "thumbnail_url":    String,
// 	    //             "homepage_url":     String,
// 	    //             "dnas": [{
// 	    //                 "location":     String,
// 	    //                 "hash":         HashString,
// 	    //                 "handle":       Option<String>,
// 	    //             }],
// 	    //             "ui":               Option<AppResource>,
// 	    //         },
// 	    //         "upvotes":              i32,
// 	    //         "upvoted_by_me":        bool,
// 	    //     }
// 	    return ZomeAPIResult({
// 		"address":		"made_up_happ_store_hash",
// 		"app_entry": {
// 		    "title":		"Holofuel",
// 		    "author":		"Holo Inc.",
// 		    "description":	"Distributed currency optimized for billions of daily microtransactions, mutual-credit, reserve accounts, simultaneous settlement. No TPS limits.",
// 		    "thumbnail_url":	"https://holofuel.com/favicon.ico",
// 		    "homepage_url":	"https://holofuel.com",
// 		    "dnas": [{
// 			"location":	"https://cdn.holo.host/holofuel/QmUx7qjbKy97vqy3Yh8TDpm64faZKfPundNP5r98i92xKS.json",
// 			"hash":		"QmUx7qjbKy97vqy3Yh8TDpm64faZKfPundNP5r98i92xKS",
// 			"handle":	"holofuel",
// 		    }],
// 		    "ui":		"",
// 		},
// 		"upvotes":		7_750_000_000, // the whole world upvoted Holofuel, even the babies
// 		"upvoted_by_me":	true,
// 	    });
// 	},
//     }
// };
// const MockHHA = {
//     "provider": {
// 	async get_app_details ( args ) {
// 	    //     {
// 	    //         "app_bundle": {
// 	    //             "happ_hash": "<happ store address>",
// 	    //         },
// 	    //         "payment_pref": [{
// 	    //             "provider_address":         Address,
// 	    //             "dna_bundle_hash":          HashString,
// 	    //             "max_fuel_per_invoice":     f64,
// 	    //             "max_unpaid_value":         f64,
// 	    //             "price_per_unit":           f64,
// 	    //         }],
// 	    //     }
// 	    return ZomeAPIResult({
// 	        "app_bundle": {
// 		    "happ_hash":		"made_up_happ_store_hash",
// 		},
// 		"payment_pref": [{
// 		    "provider_address":		"HcSCiWB7KKaQnsqkto6Q88rhmpwg63Zcdw448O7DkyiKXbrwpCrGMHtc747jjoi",
// 		    "dna_bundle_hash":		"QmWyvE7wTJbaDorg13dZbUA8KAYvxwU5M3gFXc1yYgXkav",
// 		    "max_fuel_per_invoice":	10_000,
// 		    "max_unpaid_value":		10_000,
// 		    "price_per_unit":		1,
// 		}],
// 	    });
// 	},
//     }
// };
// const AdminInstances = {
//     "happ-store": MockHappStore,
//     "holo-hosting-app": MockHHA,
// };
// const DEFAULT_IFACES = {
//     "master":	42211,
//     "service":	42222,
//     "internal":	42233,
//     "general":	42244,
// };

// function dieOnError ( ws_server ) {
//     ws_server.on("error", ( err ) => {
// 	console.log( err );
// 	process.exit();
//     });
// }

// class Conductor {
//     static send_serialization_error	= false;

//     constructor ( interfaces = DEFAULT_IFACES ) {
// 	this.interfaces			= interfaces;
// 	this.wormhole_port		= 9676;

// 	let if_entries			= Object.entries( interfaces );
// 	if_entries.map( ([name,port]) => {
// 	    this[name]			= new WebSocketServer({
// 		"port": port,
// 		"host": "localhost",
// 	    });
// 	});
// 	log.normal("Initialized mock Conductor with interfaces: %s", () => [
// 	    if_entries.map( ([k,v]) => `localhost:${v} (${k})`).join(", ") ] );

// 	dieOnError( this.master );
// 	dieOnError( this.service );
// 	dieOnError( this.internal );
// 	dieOnError( this.general );

// 	this.handleMaster();
// 	this.handleServiceLogs();
// 	this.handleInternal();
//     }

//     handleMaster ( namespace = MockMaster, prefixes = [] ) {
// 	for ( let [k,v] of Object.entries( namespace ) ) {
// 	    const segments		= prefixes.concat( k.toLowerCase() );

// 	    if ( typeof v === "function" ) {
// 		log.debug("Register method on master: %s", segments.join("/") );
// 		this.registerMasterMethod( segments.join("/"), v );
// 	    }
// 	    else if ( typeof v === "object" )
// 		this.handleMaster( v, segments );
// 	    else
// 		log.warn("Don't know how to handle value of type (%s), expected 'function' or 'object'", typeof v );
// 	}
//     }

//     registerMasterMethod ( method, fn ) {
// 	this.master.register( method, async function ( ...args ) {
// 	    log.silly("Call to 'master' interface: %s( %s )", () => [method, args.map( v => typeof v ).join(', ') ]);
// 	    return await fn.call( MockMaster, ...args );
// 	});
//     }

//     handleServiceLogs () {
// 	this.service.register("call", async function ( call_spec ) {
// 	    log.silly("Call to 'service' interface: %s/%s( %s )", () => [
// 		call_spec["zome"], call_spec["function"], Object.keys( call_spec["args"] ).join(', ') ]);
// 	    // TODO: Validate call_spec format
// 	    // TODO: Check if instance is registered/running

// 	    const zome			= MockServiceLogger[ call_spec["zome"] ];
// 	    const func			= zome[ call_spec["function"] ];

// 	    return await func.call( MockServiceLogger, call_spec["args"] );
// 	});
//     }

//     handleInternal () {
// 	this.internal.register("call", async function ( call_spec ) {
// 	    log.silly("Call to 'internal' interface: %s::%s/%s( %s )", () => [
// 		call_spec["cell_id"], call_spec["zome"], call_spec["function"], Object.keys( call_spec["args"] ).join(', ') ]);
// 	    // TODO: Validate call_spec format
// 	    // TODO: Check if instance is registered/running

// 	    let instance		= AdminInstances[ call_spec["instance_id"] ];
// 	    const zome			= instance[ call_spec["zome"] ];
// 	    const func			= zome[ call_spec["function"] ];

// 	    return await func.call( MockServiceLogger, call_spec["args"] );
// 	});
//     }

//     async stop () {
// 	log.normal("Closing interfaces: %s", Object.keys(this.interfaces).join(", ") );
// 	await this.master.close();
// 	await this.service.close();
// 	await this.internal.close();
// 	await this.general.close();
//     }

//     async wormholeRequest ( agent_id, entry ) {
// 	const message			= typeof entry === "string" ? entry : SerializeJSON( entry );

// 	log.debug("Sending wormhole request for Agent (%s) with message (length %s) over HTTP: localhost:%s", agent_id, message.length, this.wormhole_port );
// 	const resp			= await fetch(`http://localhost:${this.wormhole_port}`, {
// 	    "method": "POST",
// 	    "body": JSON.stringify({
// 		"agent_id": agent_id,
// 		"payload": message,
// 	    }),
// 	    "timeout": 1000,
// 	});
// 	const status			= resp.status;
// 	const signature			= await resp.text();

// 	log.silly("Received wormhole response (status %s): %s", status, signature );
// 	if ( status !== 200 ) {
// 	    log.error("Wormhole request returned non-success status (%s): %s", status, signature );
// 	    throw new Error("Status of response from service is not success: " + status );
// 	}

// 	return signature;
//     }
    
// }
// Conductor.ZomeAPIResult			= ZomeAPIResult;
// Conductor.ZomeAPIError			= ZomeAPIError;

// module.exports				= Conductor;

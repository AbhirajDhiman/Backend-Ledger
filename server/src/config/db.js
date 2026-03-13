const mongoose=require('mongoose');

let reconnectTimer=null;
let isConnecting=false;
let sanitizedMongoUri='';

function sanitizeEnvValue(value=''){
    return value.trim().replace(/^['\"]|['\"]$/g,'').replace(/;\s*$/,'');
}

async function connectDB(){
    const mongoUri = sanitizeEnvValue(process.env.MONGO_URI || '');
    sanitizedMongoUri=mongoUri;

    if (!mongoUri) {
        console.error('MongoDB URI is missing. Set MONGO_URI in .env');
        return false;
    }

    const clearRetryTimer=()=>{
        if(reconnectTimer){
            clearInterval(reconnectTimer);
            reconnectTimer=null;
        }
    };

    const scheduleReconnect=()=>{
        if(reconnectTimer){
            return;
        }

        reconnectTimer=setInterval(async ()=>{
            if(isConnecting || mongoose.connection.readyState===1 || !sanitizedMongoUri){
                return;
            }

            try{
                isConnecting=true;
                await mongoose.connect(sanitizedMongoUri,{
                    serverSelectionTimeoutMS:10000
                });
                console.log('Connected to MongoDB');
                clearRetryTimer();
            }catch(err){
                console.error('MongoDB reconnect failed:',err.message || err);
            }finally{
                isConnecting=false;
            }
        },10000);
    };

    mongoose.connection.removeAllListeners('connected');
    mongoose.connection.removeAllListeners('disconnected');
    mongoose.connection.removeAllListeners('error');

    mongoose.connection.on('connected',()=>{
        clearRetryTimer();
    });

    mongoose.connection.on('disconnected',()=>{
        console.warn('MongoDB disconnected. Retrying every 10s...');
        scheduleReconnect();
    });

    mongoose.connection.on('error',()=>{
        scheduleReconnect();
    });

    try{
        isConnecting=true;
        await mongoose.connect(mongoUri,{
            serverSelectionTimeoutMS:10000
        });
        console.log('Connected to MongoDB');
        clearRetryTimer();
        return true;
    }catch(err){
        console.error('Error connecting to MongoDB',err.message || err);
        console.error('Please verify Atlas Network Access (IP whitelist) and database credentials in MONGO_URI.');
        scheduleReconnect();
        return false;
    }finally{
        isConnecting=false;
    }
}

module.exports=connectDB;
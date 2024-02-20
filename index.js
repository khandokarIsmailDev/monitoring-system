const express = require('express')
const client = require('prom-client')  //metric collection
const responseTime = require('response-time')
const {doSomeHeavyTask} = require('./util')


const app = express()
const PORT = process.env.PORT || 8000

//for matric collction
const collectctDefaultMetrics = client.collectDefaultMetrics;
collectctDefaultMetrics({register:client.register})



//custom route to observe metrics
const reqResTime = new client.Histogram({
    name:"http_express_req_res_time",
    help:"This tells how much time is taken by req and res",
    labelNames:["method","route","status_code"],
    buckets:[1,50,100,200,400,500,800,2000]  // mili second e res time define kore disi
})

//middleware
app.use(responseTime((req,res,time)=>{
    reqResTime.labels({
        method:req.method,
        route:req.url,
        status_code:res.statusCode
    }).observe(time)
}))



app.get('/',(req,res)=>{
    return res.json({message:"Hello from express server"})
})

app.get('/slow',async(req,res)=>{
    try{
        const timeTaken = await doSomeHeavyTask()
        return res.json({
            status:"Success",
            message:`Heavy task completed in ${timeTaken}`
        })
    }catch(error){
        return res.status(500).json({status:"Error",error:"Internal server Error"})
    }
})


//for expose metrics
app.get('/metrics',async (req,res)=>{
    res.setHeader("Content-Type", client.register.contentType)
    const metrics = await client.register.metrics()
    res.send(metrics)
})


app.listen(PORT,()=>{
    console.log(`Express server is running ${PORT}`)
})






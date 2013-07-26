var events= require("events"),
  util= require("util")

sys= {debug:function(a,b){
	//console.log(a,b)
	//console.log(util.inspect(a),b?util.inspect(b):"")
}}

var CommandedChain = function(initialChain,opts)
{
	if(!(this instanceof CommandedChain))
		return new CommandedChain(initialChain,opts)

	this.name= opts&&opts.name||"Chain"
	this.chain = []
	this.reset()
	this.setChain(initialChain)

	this.chainResult = new events.EventEmitter() // callback for individual chains
	this.filterResult = new events.EventEmitter() // callback for individual filters
	
	this.result = new events.EventEmitter() // net chain output

	this.chainResult.addListener("success",this.chainSuccess)
	this.chainResult.addListener("error",this.chainError)
	this.filterResult.addListener("success",this.filterSuccess)
	this.filterResult.addListener("error",this.filterError)
}

CommandedChain.prototype.execute = function(ctx) {
	var chain = this.nextStack()

	// no more entries left	
	if(!chain)
		return this.doFilters(ctx)
	
	sys.debug("CHAIN ITER "+chain.name+" "+(ctx.ticket||0))

	// check if chain is a filter
	if(chain["postProcess"]) 
		this.filterStack.push(chain)

	// execute
	var result
	try {
		result= chain.execute? chain.execute(ctx): chain(ctx)
	} catch (err) {
		// fire failure
		return this.chainError(ctx,this,err,chain)
	}

	// flagged to wait for someone else to fire completion
	if(result=="defer")
		return result

	if(result) {
		// fire completion
		sys.debug("CHAIN RESULT "+result)
		return this.chainSuccess(ctx,this,result,chain)
	} else
		// continue processing chain
		return this.execute(ctx)
}

CommandedChain.prototype.chainSuccess = function(ctx,cc,result,chain) {
	sys.debug("CHAIN SUCCESS "+result)
	cc.saveResult = result
	if(result !== undefined)
		return cc.doFilters(ctx)
	else
		return cc.execute(ctx)
}

CommandedChain.prototype.chainError = function(ctx,cc,err) {
	sys.debug("CHAIN ERROR "+err)
	cc.saveError = err
	cc.filterHandled = false
	cc.doFilters(ctx)
}

CommandedChain.prototype.doFilters = function(ctx) {
	var filter = this.filterStack.pop()
	if(filter)
	{
		sys.debug("CHAIN FILTER "+filter.name+" "+(ctx.ticket||0))
		var result
		try {
			result = filter.postProcess(ctx,this,result)
		}
		catch(err) {
			sys.debug("FILTER FAIL "+err)
			return this.filterError(ctx,this,err)
		}
		if(result == "defer") {
			sys.debug("CHAIN FDEFER")
			return
		}
		sys.debug("CHAIN FILTER RESULT "+result)

		return this.filterSuccess(ctx,this,result)
	}
	else {
		var filterHandled= this.filterHandled,
		  saveResult= this.saveResult,
		  saveError= this.saveError
		this.reset()
		sys.debug("CHAIN FILTER FINISHED "+filterHandled+" "+saveResult+" "+saveError)
		if(!filterHandled){
			this.result.emit('error',ctx,this,saveError)
			return saveError
		}else{
			this.result.emit('success',ctx,this,saveResult)
			return saveResult
		}

	}
}

CommandedChain.prototype.filterSuccess = function(ctx,cc,result) {
	if(result !== undefined){
		cc.filterHandled = true
		cc.saveResult= result
	}
	return cc.doFilters(ctx)
}

CommandedChain.prototype.filterError = function(ctx,cc,err) {
	return cc.doFilters(ctx)
}

CommandedChain.prototype.nextStack = function() {
	return this.chain[this.chainPosition++]
}

CommandedChain.prototype.reset= function(){
	this.chainPosition = 0
	this.filterStack = []
	this.saveError = undefined
	this.saveResult = undefined
	this.filterHandled = true
}

CommandedChain.prototype.setChain= function(chain,opts) {
	if(!opts || !opts.noResetPos){
		this.reset()
	}
	if(chain){
		if(chain instanceof CommandedChain){
			this.chain= chain.chain.slice(0)
		}else if(chain instanceof Array){
			this.chain= chain.slice(0)
		}else{
			this.chain= [chain]
		}
	}else{
		this.chain= []
	}
}

if(typeof exports == 'undefined'){
	module= {exports: {}}
	exports= module.exports
}
module.exports= CommandedChain
module.exports.CommandedChain= CommandedChain

var events= require("events"),
  util= require("util")

sys= {debug:function(a){
	console.log(util.inspect(a))
}}

var CommandedChain = function(initialChain,opts)
{
	if(!(this instanceof CommandedChain))
		return new CommandedChain(initialChain,opts)

	this.name = opts&&opts.name||"Chain"

	this.chain = []
	this.setChain(initialChain)
	this.chainPosition = 0
	this.filterStack = []
		
	this.saveError = null
	this.saveResult = null
	this.filterHandled = true

	this.chainResult = new events.EventEmitter() // callback for individual chains
	this.filterResult = new events.EventEmitter() // callback for individual filters
	
	this.result = new events.EventEmitter() // net chain output

	this.execute = function(ctx) {
		var chain = this.nextStack()

		// no more entries left	
		if(!chain)
			return this.doFilters(ctx)
		
		sys.debug("CHAIN ITER "+chain.name+" "+(ctx.ticket||0))

		// check if chain is a filter
		if(chain["postProcess"]) 
			this.filterStack.push(chain)

		// execute
		try {
			var result= chain.execute? chain.execute(ctx): chain.call(ctx)
		} catch (err) {
			// fire failure
			this.chainResult.emit("error",ctx,this,err,chain)
			return false
		}

		// flagged to wait for someone else to fire completion
		if(result=="defer")
			return result
		
		if(result) {
			// fire completion
			sys.debug("CHAIN RESULT "+result)
			this.chainResult.emit("success",ctx,this,result,chain)
			return true
		} else
			// continue processing chain
			return this.execute(ctx)
	}

	this.chainSuccess = function(ctx,cc,result) {
		sys.debug("CHAIN SUCCESS "+result)
		cc.saveResult = result
		if(result)
			cc.doFilters(ctx)
		else
			cc.execute(ctx)
	}

	this.chainError = function(ctx,cc,err) {
		sys.debug("CHAIN ERROR "+err)
		cc.saveError = err
		cc.filterHandled = false
		cc.doFilters(ctx)
	}

	this.doFilters = function(ctx) {
		var filter = this.filterStack.pop()
		if(filter)
		{
			sys.debug("CHAIN FILTER "+filter.name+" "+(ctx.ticket||0))
			try {
				var result = filter.postProcess(ctx,this.saveErr)
			}
			catch(err) {}
			if(result == "defer") {
				sys.debug("CHAIN FDEFER")
				return
			}

			this.filterResult.emit("success",ctx,this,result)
		}
		else {
			//sys.debug("CHAIN FILTER FINISHED "+this.filterHandled+" "+this.saveResult+" "+this.saveError)
			if(!this.filterHandled)
				this.result.emit('error',ctx,this,this.saveError)
			else
				this.result.emit('success',ctx,this,this.saveResult)
		}
	}
	
	this.filterSuccess = function(ctx,cc,result) {
		if(result)
			cc.filterHandled = true
		cc.doFilters(ctx)
	}

	this.filterError = function(ctx,cc,err) {
		cc.doFilters(ctx)
	}

	this.nextStack = function() {
		return this.chain[this.chainPosition++]
	}

	this.setChain = 	this.chainResult.addListener("success",this.chainSuccess)
	this.chainResult.addListener("error",this.chainError)
	this.filterResult.addListener("success",this.filterSuccess)
	this.filterResult.addListener("error",this.filterError)
}

CommandedChain.prototype.setChain= function(chain,opts) {
	if(chain){
		if(chain instanceof CommandedChain){
			this.chain= chain.chain.slice(0)
		}else if(!(chain instanceof Array)){
			this.chain= [chain]
		}else{
			this.chain= chain.slice(0)
		}
	}else{
		this.chain= []
	}
	if(!opts || !opts.noResetPos)
		this.chainPosition = 0
}

if(typeof exports == 'undefined')
	exports = {}
module.exports= CommandedChain
module.exports.CommandedChain= CommandedChain

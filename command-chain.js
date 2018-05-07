/**
* Advance to the next function in the chain, returning the function.
* This is the default implementation, used by @{link next()} if no other nextFn is provided.
*/
export function nextFn(ctx){
	return ctx.chain[ ctx._pos++]
}

/**
* More like "advance and run": advance to the next function in the chain, & run it, passing in `ctx`.
*/
export function next(){
	const
	  // iterate, retrieving our next function
	  _nextFn= this._nextFn|| nextFn,
	  // find next function
	  fn= _nextFn( this)
	// end execution if there's nothing here
	if (!fn){
		return this
	}

	// next we run the function.
	fn( this)
	// return this, allowing an eloquent programming style
	return this 
}

/**
* @param ctx - a context to be passed along
* @param ctx.chain - an array of functions to call in sequence
* @param [ctx._pos=0] - how far along in the chain we have run
* @returns the final `ctx.output` provided at the end of executing the chain
*/
export function cc( ctx){
	// expected: chain
	ctx._pos= 0
	ctx.next= next.bind(ctx)
	ctx.next()
	if (ctx.error){
		throw ctx.error
	}
	return ctx.output
}
export default cc

/**
* Advance to the next function in the chain, returning the function.
* This is the default implementation, used by @{link next()} if no other nextFn is provided.
*/
export function nextElement( ctx){
	return ctx.iterator.next().value
}

/**
* More like "advance and run": advance to the next function in the chain, & run it, passing in `ctx`.
*/
export function next(){
	// iterate, retrieving our next function or element
	const el= (this.nextElement|| nextElement)( this)
	// end execution if there's nothing here
	if (!el){
		return
	}

	// next we run the function.
	if( this.eval){
		this.eval( el)
	}else{
		el( this)
	}
}

/**
* @param ctx - a context to be passed along
* @param ctx.chain - an array of functions to call in sequence
* @param [ctx._pos=0] - how far along in the chain we have run
* @returns the final `ctx.output` provided at the end of executing the chain
*/
export function cc( ctx){
	// expected: chain
	ctx.iterator= ctx.chain[ Symbol.iterator]()
	ctx.next= next.bind( ctx)
	ctx.next()
	if (ctx.error){
		throw ctx.error
	}
	return ctx.output
}
export default cc

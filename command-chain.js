/**
* Advance to the next function in the chain, returning the function.
* This is the default implementation, used by @{link next()} if no other nextFn is provided.
*/
export function nextElement( exec){
	return exec.iterator.next().value
}

/**
* More like "advance and run": advance to the next function in the chain, & run it, passing in `exec`.
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
		// user wants to execute this element themself
		this.eval( el)
	}else{
		el( this)
	}
}

/**
* @param exec - the execution state to run a chain on
* @param exec.chain - the iterable of chains to run on the exec state
* @returns the final `exec.output` provided at the end of executing the chain
*/
export function cc( exec){
	// expected: chain
	exec.iterator= exec.iterator|| exec.chain[ Symbol.iterator]()
	exec.next= next.bind( exec)
	exec.next()
	if (exec.error){
		throw exec.error
	}
	return exec.output
}
export default cc

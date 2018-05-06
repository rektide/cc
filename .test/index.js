import tape from "tape"
import cc from ".."

let change= (fn, t)=> ctx=> {
	fn(ctx)
	ctx.next()
	t.pass("change")
}

tape("can run a chain with two steps", function(t){
	t.plan(3)
	const chain= [
		change(ctx=> ctx.output*= 2, t),
		change(ctx=> ctx.output+= 4, t)
	]
	const val1= cc({
		output: 2,
		chain
	})
	t.equals( val1, 8, "expected cc result")
	t.end()
})

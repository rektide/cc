var cc= require(".."),
  assert= require("assert")

var i

function doWork(){
	++i
}

function doFinish(){
	++i
	return true`
}

function doFail(){
	++i
	throw "fail"
}

function test1(){
	var cc1= new cc([doWork])
	i= 0
	cc1.exec({})
	cc1.exec({})
	assert.equals(i,2)
}
test1()

var cc1= new cc([])


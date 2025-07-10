import { getCallSite } from './stacktrace'

function debugCallsite() {
  console.log('Frame 0:', getCallSite(0))
  console.log('Frame 1:', getCallSite(1))
  console.log('Frame 2:', getCallSite(2))
  console.log('Frame 3:', getCallSite(3))
  console.log('Frame 4:', getCallSite(4))
}

function testCallsite() {
  debugCallsite()
}

testCallsite()

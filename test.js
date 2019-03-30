let Lazy = require('./lazy');

// Sieve of Erastothenes
function primes() {
	function* sieve(a) {
		let head = a.head;
		let tail = a.tail.filter(x => x % head !== 0);
		yield* Lazy.cons(head, sieve(tail));
	}
	return Lazy.from(() => sieve(Lazy.naturals(2)), true);
}

// Alternative without generators, using Lazy.from to break infinite recursion
function primes2() {
	function sieve(a) {
		let head = a.head;
		let tail = a.tail.filter(x => x % head !== 0);
		return Lazy.cons(head, Lazy.from(() => sieve(tail)), true);
	}
	return sieve(Lazy.naturals(2));
}

// Efficient Fibonacci number sequence generator
function fibs() {
	function* f(a, b) {
		yield* Lazy.cons(a, f(b, a + b));
	}
	return Lazy.from(() => f(1, 1), true);
}

// Alternative without generators, using Lazy.from to break recursion
function fibs2() {
	function f(a, b) {
		return Lazy.cons(a, Lazy.from(() => f(b, a + b)), true);
	}
	return f(1, 1);
}

console.log([ ... primes().take(10) ]);
console.log([ ... fibs().take(10) ]);

let sum = (a, b) => a + b
let isEven = n => n % 2 === 0;
let euler2 = fibs().takeWhile(n => n < 4000000).filter(isEven).reduce(sum);
console.log(euler2);

let a = Lazy.cons(1, [2, 3, 4, 5]);
console.log([ ... a ]);

// let b = Lazy.from(1);

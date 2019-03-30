let Lazy = require('./lazy');

function primes() {
	function sieve(a) {
		let head = a.head;
		let tail = a.tail.filter(x => x % head !== 0);
		return Lazy.cons(head, Lazy.from(() => sieve(tail)));
	}
	return sieve(Lazy.naturals(2));
}

const p = primes();
console.log([ ... p.take(30) ]);

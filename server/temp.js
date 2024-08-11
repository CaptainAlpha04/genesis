function isPrime(num) {
  // Check if the number is less than 2
  if (num < 2) {
    return false;
  }
  // Iterate from 2 to the square root of the number
  for (let i = 2; i <= Math.sqrt(num); i++) {
    // If the number is divisible by any number in the loop
    if (num % i === 0) {
      return false;
    }
  }
  // If the number is not divisible by any number in the loop
  return true;
}

// Function to print prime numbers infinitely
function printPrimeNumbers() {
  // Start with the first prime number
  let num = 2;
  while (true) {
    // Check if the number is prime
    if (isPrime(num)) {
      console.log(num);
    }
    // Increment the number
    num++;
  }
}

// Call the function to print prime numbers infinitely
printPrimeNumbers();
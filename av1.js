function volta(a, b) {
  if (b === 0) {
    return a
  } else {
    console.log(a, b, a % b)
    return volta(b, a % b)
  }
}

console.log(volta(30, 21))
vvvvvv
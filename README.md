# Similar To

## Find text similar to another peice of text

This is a simple function that takes as a first argument a string and as a second argument an array of strings and returns the string that most closely resembles the original.  

```
const similarto = require('@trevor.linton/similarto')
similarto('I\'m going to france', ['To be or not to be that is the question', 'You dont see that sort of behavior in major appliances', 'I will be traveling to europe'])
	.then((x) => console.log(x))
```

Note, similarto is an async func, if used without `await` keyword, you'll need to use the returned result as a promise.
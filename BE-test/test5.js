/**
 * Direction:
 * Find prefix of the word from array of string
 *
 * Expected Result:
 * fl
 */
const words = ["flower", "flow", "flight"];

function result(words) {
  var splits = words.map((item) => item.split(""));
  var c = 0;
  var matches = true;
  while (matches) {
    var letter = splits[0][c];
    if (letter != null) {
      matches = splits.every((s) => s[c] == letter);
      if (matches) c++;
    } else matches = false;
  }

  var prefix = words[0].slice(0, c);
  console.log("The prefix is: " + prefix);
}

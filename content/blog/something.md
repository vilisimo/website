---
title: Something
date: 2018-01-20T21:34:45+02:00
draft: true
tags: ["testing"]
categories: ["test"]
---
Some text. And some python code:

{{< highlight python >}}
class TestClass:
    __init__(self, a):
        a = 1
{{< /highlight >}}

{{< highlight html >}}
  <html>
    <body></body>
  </html>
{{< /highlight >}}

{{< highlight java "linenos=inline" >}}
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello world");
    }
}
{{< /highlight >}}

{{< highlight bash >}}
ps aux | grep
read -ep "Enter stuff: " stuff
{{< /highlight >}}

{{< highlight bash >}}
void main() {
  return 0;
}
{{< /highlight >}}

{{< highlight markdown >}}

| Tables        | Are           | Cool  |
| ------------- |---------------| ------|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

{{< /highlight >}}

{{< highlight go "linenos=table,hl_lines=8 15-17,linenostart=199" >}}
// GetTitleFunc returns a func that can be used to transform a string to title case.
//
// The supported styles are
//
// - "Go" (strings.Title)
// - "AP" (see https://www.apstylebook.com/)
// - "Chicago" (see http://www.chicagomanualofstyle.org/home.html)
//
// If an unknown or empty style is provided, AP style is what you get.
func GetTitleFunc(style string) func(s string) string {
  switch strings.ToLower(style) {
  case "go":
    return strings.Title
  case "chicago":
    tc := transform.NewTitleConverter(transform.ChicagoStyle)
    return tc.Title
  default:
    tc := transform.NewTitleConverter(transform.APStyle)
    return tc.Title
  }
}
{{< / highlight >}}

---

Some manual code: `public static void main()`. 

And that's about it. Here's a list for a good measure:

- A
- B
- C


A table: 

| Tables        | Are           | Cool  |
| -------------: |:-------------:| :-----|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |
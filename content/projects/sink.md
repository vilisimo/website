---
title: Sink
draft: false
project: sink
weight: 1
description: Find out exactly how bad your financial situation is
languages: [dart]
tools: [flutter, firebase, flutter redux]
date: 2018-05-12T19:16:00+03:00
---


## What
`Sink` is a personal finance tracker that helps to track your expenses. It
can be used to get a better overview of what exactly the money is being spent
on. On the other hand, it's still in (slow) development and not it is not
available in either of the app stores, so you'll probably want something else
for now.

## Why
I began coding it to get a grip on Flutter, at the time a new and shiny tool
that was flying mostly under the radar. I've had a lot of fun learning Flutter
and Dart, and I hope to eventually complete the project properly.

## Screens

### Registration & Sign In
Below are the registration and sign in screens. Authentication is done via Firebase using email address.

![Sign In](https://raw.githubusercontent.com/vilisimo/sink/master/screens/signin.png "Sign In screen")
![Registration](https://raw.githubusercontent.com/vilisimo/sink/master/screens/register.png "Registration screen")

### Main screen
![Main screen](https://raw.githubusercontent.com/vilisimo/sink/master/screens/entries.png "Main screen of Sink")

### Breakdowns
A breakdown showing how much (and on what) was spent in May:

![Month's breakdown](https://raw.githubusercontent.com/vilisimo/sink/master/screens/month-summary.png "Monthly breakdown")

A breakdown showing 2018-2019 expenses. User can click on the month of
interest to see a detailed breakdown for that month.

![Year's breakdown](https://raw.githubusercontent.com/vilisimo/sink/master/screens/year-summary.png "Year's breakdown")

It's worth noting that while I initially experimented with
[Google's charts](https://pub.dev/packages/charts_flutter),
I found them to be a bit bland and uninspiring at that point of time. Hence,
the charts that are shown here are handcrafted, with the exception of circular
chart, which uses
[flutter_circular_chart](https://pub.dev/packages/flutter_circular_chart)
package. This proved to be much easier than expected, which just goes to show
that you don't need to be a genius to get a half decent result on Flutter.
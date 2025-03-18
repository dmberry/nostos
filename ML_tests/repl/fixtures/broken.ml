(* Well-formed until the third declaration, which is ill-typed. A file must
   stop where it goes wrong rather than pressing on with half a program
   loaded, and must say which file it stopped in. *)

val a = 1

fun twice n = n * 2

val bad = twice "not a number"

val never = 99

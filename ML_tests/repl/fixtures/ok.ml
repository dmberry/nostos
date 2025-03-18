(* A whole, well-typed program, laid out the way ML is actually written:
   several lines per declaration, with the continuation indented. Used by the
   REPL tests to check that a file is read as declarations rather than as one
   physical line at a time. *)

fun fact n =
  if n = 0 then 1
  else n * fact (n - 1)

fun sum nil = 0
  | sum (h :: t) = h + sum t

val answer = fact 5 + sum [1, 2, 3]

echo "fixture ran"

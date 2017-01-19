:
fix_names(){(

  shopt -s nullglob >/dev/null 2>&1 || true
  shwordsplit >/dev/null 2>&1 || true

  no_dry_run=echo
  if [ "--no-dry-run" = "$1" ]; then no_dry_run="sh -x -c"; shift; fi
  for f in "$@"
  do
    if [ -f "$f" ]; then
      md5=$(openssl md5 "$f" | awk '{print$2}')
      typ=$(identify "$f" | awk '{print$2}' | tr A-Z a-z)
      n="$md5.$typ"
      if [ ! "$f" -ef "$n" ]; then
	if test -f "$n"; then
	  $no_dry_run "rm -fv '$f'"
	else
	  $no_dry_run "mv -v '$f' '$n'"
	fi
      fi
    fi
  done
)}

return

fix_names --no-dry-run ./*.jpg ./*.jpeg ./*.png ./*.JPG ./*.JPEG ./*.PNG ./*.gif ./*.GIF

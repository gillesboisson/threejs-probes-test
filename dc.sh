create_local_certificates(){

  echo "Creating CA and certificates for (*.)app.vr.test"
  echo ""
  # we use mkcert in docker for that. Check https://github.com/FiloSottile/mkcert
  $(which docker) run --rm \
    -v "./infra/certs/:/certs" \
    -e "CAROOT=/certs" \
     goodeggs/mkcert \
     -cert-file /certs/local-cert.pem -key-file /certs/local-key.pem \
     "app.vr.test" "*.app.vr.test"  
}

"$@"
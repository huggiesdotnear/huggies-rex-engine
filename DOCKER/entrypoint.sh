#!/bin/sh
# ====================================
# huggies-rex-engine entrypoint
# run the binary as the unprivileged huggies-rex user
# ====================================
exec su -s /bin/sh huggies-rex -c '/app/huggies-rex-engine'
# ====================================
# copyright 2026 by sleet.near

#!/usr/bin/env bash

install_offline_packages() {
  local pkg_dir="$INSTALL_ROOT/bundle/packages"
  [[ -d "$pkg_dir" ]] || return 0

  shopt -s nullglob
  local rpms=("$pkg_dir"/*.rpm)
  local debs=("$pkg_dir"/*.deb)

  if [[ ${#rpms[@]} -gt 0 ]]; then
    log_install "INFO" "Installing ${#rpms[@]} offline RPM packages"
    if command -v dnf >/dev/null 2>&1; then
      (cd "$pkg_dir" && sudo dnf install -y ./*.rpm)
    else
      sudo rpm -Uvh "${rpms[@]}"
    fi
    log_success "1" "Offline RPM packages installed"
  elif [[ ${#debs[@]} -gt 0 ]]; then
    log_install "INFO" "Installing ${#debs[@]} offline DEB packages"
    sudo dpkg -i "${debs[@]}" || sudo apt-get -f install -y
    log_success "1" "Offline DEB packages installed"
  else
    log_install "INFO" "No offline OS packages in bundle/packages — expecting pre-installed PostgreSQL/Node"
  fi
}

install_portable_node() {
  if command -v node >/dev/null 2>&1; then
    log_success "4" "Node.js already available: $(node -v)"
    return 0
  fi

  local node_dir="$INSTALL_ROOT/bundle/node"
  local tarball
  tarball="$(find "$node_dir" -maxdepth 1 -name 'node-v*-linux-x64.tar.xz' 2>/dev/null | head -1)"
  [[ -n "$tarball" ]] || return 0

  local target="${YUNO_INSTALL_ROOT:-/opt/yuno}/node"
  mkdir -p "$target"
  tar -xJf "$tarball" -C "$target" --strip-components=1
  ln -sf "$target/bin/node" /usr/local/bin/node 2>/dev/null || sudo ln -sf "$target/bin/node" /usr/local/bin/node
  log_success "4" "Portable Node.js installed from offline bundle"
}

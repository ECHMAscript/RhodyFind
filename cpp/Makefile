# RhodyFind C++ spatial search.
#   make test   - correctness tests (k-d tree vs brute force)
#   make bench  - native benchmark -> ../benchmarks/results.csv and ../src/data/benchmarkNative.json
#   make wasm   - WebAssembly build for the web app -> ../src/wasm/kdtree.js (needs Emscripten's emcc)

CXX ?= c++
CXXFLAGS ?= -std=c++17 -O2 -Wall -Wextra
BUILD := build

WASM_EXPORTS := _malloc,_free,_kd_create,_kd_free,_kd_size,_kd_knn,_bf_knn,_kd_bench,_bf_bench,_kd_last_build_ms

.PHONY: test bench wasm clean

test: $(BUILD)/tests
	./$(BUILD)/tests

bench: $(BUILD)/bench
	./$(BUILD)/bench ../benchmarks/results.csv ../src/data/benchmarkNative.json

$(BUILD)/tests: tests.cpp kdtree.hpp | $(BUILD)
	$(CXX) $(CXXFLAGS) tests.cpp -o $@

$(BUILD)/bench: bench.cpp kdtree.hpp | $(BUILD)
	$(CXX) $(CXXFLAGS) bench.cpp -o $@

$(BUILD):
	mkdir -p $(BUILD)

# One self-contained JS file (the .wasm is embedded), loadable by Metro on the web.
wasm: wasm_api.cpp kdtree.hpp
	mkdir -p ../src/wasm
	emcc -std=c++17 -O3 wasm_api.cpp -o ../src/wasm/kdtree.js \
	  -sMODULARIZE=1 -sEXPORT_NAME=createKDTreeModule -sSINGLE_FILE=1 \
	  -sENVIRONMENT=web -sALLOW_MEMORY_GROWTH=1 -sFILESYSTEM=0 \
	  -sEXPORTED_FUNCTIONS=$(WASM_EXPORTS) -sEXPORTED_RUNTIME_METHODS=HEAPF64,HEAP32

clean:
	rm -rf $(BUILD)

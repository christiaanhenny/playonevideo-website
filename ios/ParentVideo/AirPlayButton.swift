import AVKit
import UIKit

@objc(AirPlayButton)
class AirPlayButton: UIView {
  private let routePicker = AVRoutePickerView()

  override init(frame: CGRect) {
    super.init(frame: frame)
    setup()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setup()
  }

  private func setup() {
    routePicker.tintColor = .white
    routePicker.activeTintColor = .white
    routePicker.translatesAutoresizingMaskIntoConstraints = false
    addSubview(routePicker)
    NSLayoutConstraint.activate([
      routePicker.topAnchor.constraint(equalTo: topAnchor),
      routePicker.bottomAnchor.constraint(equalTo: bottomAnchor),
      routePicker.leadingAnchor.constraint(equalTo: leadingAnchor),
      routePicker.trailingAnchor.constraint(equalTo: trailingAnchor),
    ])
  }
}

@objc(AirPlayButtonManager)
class AirPlayButtonManager: RCTViewManager {
  override func view() -> UIView! {
    return AirPlayButton()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
